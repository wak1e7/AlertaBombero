-- The citizen flow accepts one photo or video per emergency report.
-- Keep the earliest evidence for any legacy report that was retried.
with ranked_evidence as (
  select
    id,
    row_number() over (partition by report_id order by created_at asc, id asc) as position
  from public.report_evidence
)
delete from public.report_evidence evidence
using ranked_evidence ranked
where evidence.id = ranked.id
  and ranked.position > 1;

alter table public.report_evidence
  add constraint report_evidence_one_per_report unique (report_id);
