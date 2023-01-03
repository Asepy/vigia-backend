DELETE FROM ocds.planning_items WHERE id IN (
SELECT a.id FROM ocds.planning_items a
JOIN ocds.planning_items b ON (a.ocid = b.ocid) AND (a.id < b.id));

DELETE FROM ocds.tender_items WHERE id IN (
SELECT a.id FROM ocds.tender_items a
JOIN ocds.tender_items b ON (a.ocid = b.ocid) AND (a.id < b.id));

DELETE FROM ocds.parties WHERE id IN (
SELECT a.id FROM ocds.parties a
JOIN ocds.parties b ON (a.ocid = b.ocid) AND (a.id < b.id));

DELETE FROM ocds.procurement WHERE id IN (
SELECT a.id FROM ocds.procurement a
JOIN ocds.procurement b ON (a.ocid = b.ocid) AND (a.id < b.id));
