DELETE FROM ocds.data WHERE id IN (
SELECT id FROM ocds.data
WHERE (data->'tender'->'tenderPeriod'->>'endDate')::TIMESTAMP < (current_timestamp AT TIME ZONE 'America/Asuncion'));

DELETE FROM ocds.planning_items WHERE id IN (
SELECT a.id FROM ocds.planning_items a
LEFT JOIN ocds.data b ON a.data_id = b.id WHERE b.id IS NULL);

DELETE FROM ocds.tender_items WHERE id IN (
SELECT a.id FROM ocds.tender_items a
LEFT JOIN ocds.data b ON a.data_id = b.id WHERE b.id IS NULL);

DELETE FROM ocds.parties WHERE id IN (
SELECT a.id FROM ocds.parties a
LEFT JOIN ocds.data b ON a.data_id = b.id WHERE b.id IS NULL);

DELETE FROM ocds.procurement WHERE id IN (
SELECT a.id FROM ocds.procurement a
LEFT JOIN ocds.data b ON a.data_id = b.id WHERE b.id IS NULL);
