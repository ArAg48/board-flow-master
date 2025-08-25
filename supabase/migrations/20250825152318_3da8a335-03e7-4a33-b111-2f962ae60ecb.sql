-- 1) Function to recalculate a session's metrics from board_data
CREATE OR REPLACE FUNCTION public.recalculate_session_metrics(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  s record;
  v_total int := 0;
  v_pass int := 0;
  v_fail int := 0;
  v_end timestamptz;
  v_duration int := 0;
BEGIN
  SELECT * INTO s FROM public.scan_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN RETURN; END IF;

  v_end := COALESCE(s.end_time, now());

  SELECT
    COUNT(*)::int,
    COUNT(*) FILTER (WHERE test_status = 'pass')::int,
    COUNT(*) FILTER (WHERE test_status = 'fail')::int
  INTO v_total, v_pass, v_fail
  FROM public.board_data bd
  WHERE bd.ptl_order_id = s.ptl_order_id
    AND bd.technician_id = s.technician_id
    AND bd.test_date >= s.start_time
    AND bd.test_date <= v_end;

  v_duration := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (v_end - s.start_time)) / 60)::int);

  UPDATE public.scan_sessions
  SET total_scanned = v_total,
      pass_count = v_pass,
      fail_count = v_fail,
      duration_minutes = COALESCE(duration_minutes, v_duration),
      actual_duration_minutes = COALESCE(actual_duration_minutes, v_duration),
      updated_at = now()
  WHERE id = p_session_id;
END;
$$;

-- 2) Trigger: when board_data changes, recompute affected sessions
CREATE OR REPLACE FUNCTION public.after_board_data_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  t_id uuid;
  po_id uuid;
  ts timestamptz;
BEGIN
  IF TG_OP = 'DELETE' THEN
    t_id := OLD.technician_id;
    po_id := OLD.ptl_order_id;
    ts := COALESCE(OLD.test_date, now());
  ELSE
    t_id := NEW.technician_id;
    po_id := NEW.ptl_order_id;
    ts := COALESCE(NEW.test_date, now());
  END IF;

  IF t_id IS NULL OR po_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  PERFORM public.recalculate_session_metrics(s.id)
  FROM public.scan_sessions s
  WHERE s.technician_id = t_id
    AND s.ptl_order_id = po_id
    AND s.start_time <= ts
    AND (s.end_time IS NULL OR s.end_time >= ts);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_board_data_recalc ON public.board_data;
CREATE TRIGGER trg_board_data_recalc
AFTER INSERT OR UPDATE OR DELETE ON public.board_data
FOR EACH ROW EXECUTE FUNCTION public.after_board_data_change();

-- 3) Trigger: when scan_session changes, recompute its metrics
CREATE OR REPLACE FUNCTION public.after_scan_sessions_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.recalculate_session_metrics(COALESCE(NEW.id, OLD.id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_scan_sessions_recalc ON public.scan_sessions;
CREATE TRIGGER trg_scan_sessions_recalc
AFTER INSERT OR UPDATE ON public.scan_sessions
FOR EACH ROW EXECUTE FUNCTION public.after_scan_sessions_update();

-- 4) Update get_scan_history: only sessions with scans count
CREATE OR REPLACE FUNCTION public.get_scan_history(p_technician_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, created_at timestamp with time zone, start_time timestamp with time zone, end_time timestamp with time zone, duration_minutes integer, actual_duration_minutes integer, total_scanned integer, pass_count integer, fail_count integer, session_status session_status, ptl_order_id uuid, ptl_order_number text, ptl_order_status order_status, board_type text, technician_id uuid, technician_name text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    ss.id,
    ss.created_at,
    ss.start_time,
    ss.end_time,
    ss.duration_minutes,
    ss.actual_duration_minutes,
    COALESCE(bd_counts.total_scanned, 0)::integer as total_scanned,
    COALESCE(bd_counts.pass_count, 0)::integer as pass_count,
    COALESCE(bd_counts.fail_count, 0)::integer as fail_count,
    ss.status,
    ss.ptl_order_id,
    po.ptl_order_number,
    po.status,
    po.board_type,
    ss.technician_id,
    p.full_name
  FROM public.scan_sessions ss
  LEFT JOIN public.ptl_orders po ON ss.ptl_order_id = po.id
  LEFT JOIN public.profiles p ON ss.technician_id = p.id
  LEFT JOIN (
    SELECT 
      ss_inner.id as session_id,
      COUNT(bd.id) as total_scanned,
      COUNT(bd.id) FILTER (WHERE bd.test_status = 'pass') as pass_count,
      COUNT(bd.id) FILTER (WHERE bd.test_status = 'fail') as fail_count
    FROM public.scan_sessions ss_inner
    LEFT JOIN public.board_data bd ON (
      bd.ptl_order_id = ss_inner.ptl_order_id 
      AND bd.technician_id = ss_inner.technician_id
      AND bd.test_date >= ss_inner.start_time
      AND (ss_inner.end_time IS NULL OR bd.test_date <= ss_inner.end_time)
    )
    GROUP BY ss_inner.id
  ) bd_counts ON ss.id = bd_counts.session_id
  WHERE (p_technician_id IS NULL OR ss.technician_id = p_technician_id)
    AND COALESCE(bd_counts.total_scanned, 0) > 0
  ORDER BY ss.created_at DESC;
$function$;

-- 5) Update progress functions to compute time from sessions and only count sessions with scans
CREATE OR REPLACE FUNCTION public.update_ptl_progress(p_ptl_order_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_counts record;
  v_order record;
  v_completion_percentage numeric;
  v_timing record;
BEGIN
  SELECT * INTO v_order FROM public.ptl_orders WHERE id = p_ptl_order_id;
  IF NOT FOUND THEN RETURN false; END IF;

  SELECT * INTO v_counts FROM public.count_scanned_boards(p_ptl_order_id);

  SELECT 
    COALESCE(SUM(COALESCE(s.duration_minutes, FLOOR(EXTRACT(EPOCH FROM (COALESCE(s.end_time, now()) - s.start_time)) / 60)::int)), 0) as total_time,
    COALESCE(SUM(COALESCE(s.actual_duration_minutes, FLOOR(EXTRACT(EPOCH FROM (COALESCE(s.end_time, now()) - s.start_time)) / 60)::int)), 0) as active_time
  INTO v_timing
  FROM public.scan_sessions s
  WHERE s.ptl_order_id = p_ptl_order_id
    AND EXISTS (
      SELECT 1 FROM public.board_data bd
      WHERE bd.ptl_order_id = s.ptl_order_id
        AND bd.technician_id = s.technician_id
        AND bd.test_date >= s.start_time
        AND (s.end_time IS NULL OR bd.test_date <= s.end_time)
    );

  IF v_order.quantity > 0 THEN
    v_completion_percentage := (v_counts.total_count::numeric / v_order.quantity::numeric * 100);
  ELSE
    v_completion_percentage := 0;
  END IF;

  INSERT INTO public.ptl_order_progress (
    id, ptl_order_number, board_type, quantity, status,
    scanned_count, passed_count, failed_count, completion_percentage,
    total_time_minutes, active_time_minutes
  ) VALUES (
    p_ptl_order_id,
    v_order.ptl_order_number,
    v_order.board_type,
    v_order.quantity,
    v_order.status,
    v_counts.total_count,
    v_counts.pass_count,
    v_counts.fail_count,
    v_completion_percentage,
    COALESCE(v_timing.total_time, 0),
    COALESCE(v_timing.active_time, 0)
  )
  ON CONFLICT (id) DO UPDATE SET
    scanned_count = EXCLUDED.scanned_count,
    passed_count = EXCLUDED.passed_count,
    failed_count = EXCLUDED.failed_count,
    completion_percentage = EXCLUDED.completion_percentage,
    total_time_minutes = EXCLUDED.total_time_minutes,
    active_time_minutes = EXCLUDED.active_time_minutes,
    updated_at = now();
  
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_ptl_progress()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.ptl_order_progress (
    id, ptl_order_number, board_type, quantity, status,
    scanned_count, passed_count, failed_count, completion_percentage,
    total_time_minutes, active_time_minutes
  )
  SELECT 
    po.id,
    po.ptl_order_number,
    po.board_type,
    po.quantity,
    po.status,
    COALESCE(bd_stats.total_count, 0),
    COALESCE(bd_stats.pass_count, 0),
    COALESCE(bd_stats.fail_count, 0),
    CASE WHEN po.quantity > 0 THEN (COALESCE(bd_stats.total_count, 0)::numeric / po.quantity::numeric * 100) ELSE 0 END,
    COALESCE(ss_stats.total_time, 0),
    COALESCE(ss_stats.active_time, 0)
  FROM public.ptl_orders po
  LEFT JOIN (
    SELECT 
      ptl_order_id,
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE test_status = 'pass') as pass_count,
      COUNT(*) FILTER (WHERE test_status = 'fail') as fail_count
    FROM public.board_data 
    GROUP BY ptl_order_id
  ) bd_stats ON po.id = bd_stats.ptl_order_id
  LEFT JOIN (
    SELECT 
      s.ptl_order_id,
      SUM(COALESCE(s.duration_minutes, FLOOR(EXTRACT(EPOCH FROM (COALESCE(s.end_time, now()) - s.start_time)) / 60)::int)) as total_time,
      SUM(COALESCE(s.actual_duration_minutes, FLOOR(EXTRACT(EPOCH FROM (COALESCE(s.end_time, now()) - s.start_time)) / 60)::int)) as active_time
    FROM public.scan_sessions s
    WHERE EXISTS (
      SELECT 1 FROM public.board_data bd
      WHERE bd.ptl_order_id = s.ptl_order_id
        AND bd.technician_id = s.technician_id
        AND bd.test_date >= s.start_time
        AND (s.end_time IS NULL OR bd.test_date <= s.end_time)
    )
    GROUP BY s.ptl_order_id
  ) ss_stats ON po.id = ss_stats.ptl_order_id
  ON CONFLICT (id) DO UPDATE SET
    scanned_count = EXCLUDED.scanned_count,
    passed_count = EXCLUDED.passed_count,
    failed_count = EXCLUDED.failed_count,
    completion_percentage = EXCLUDED.completion_percentage,
    total_time_minutes = EXCLUDED.total_time_minutes,
    active_time_minutes = EXCLUDED.active_time_minutes,
    updated_at = now();
END;
$function$;

-- 6) Backfill: recalc all existing sessions and refresh progress
DO $$
DECLARE r record; BEGIN
  FOR r IN SELECT id FROM public.scan_sessions LOOP
    PERFORM public.recalculate_session_metrics(r.id);
  END LOOP;
END $$;

SELECT public.refresh_ptl_progress();