INSERT INTO ocds.procurement (release_date, ocid, data_id, tender_id, characteristics, tender_amount, budget_amount, budget_currency, tender_currency,
                                  tender_date_published, planning_estimated_date, tender_enquiryperiod_start_date, tender_enquiryperiod_end_date,
                                  tender_tenderperiod_end_date, tender_tenderperiod_start_date, tender_procurementmethoddetails, buyer_name, buyer_id,
                                  tender_bidopening_date, tender_awardcriteria_details, tender_status, tender_status_details,
                                  tender_title, tender_mainprocurementcategorydetails, tender_numberoftenderers, number_of_awards,
                                  framework_agreement, electronic_auction, budget, documents, tender_numberofenquiries, url,
                                  tender_procurementmethod, tender_mainprocurementcategory, planning_identifier) (
    SELECT DISTINCT ON (r.ocid)
        (r.data->>'date')::TIMESTAMP AS release_date,
        r.ocid AS ocid,
        r.id as data_id,
        r.data->'tender'->>'id' as tender_id,
        r.data->'tender'->'coveredBy' as characteristics,
        (r.data->'tender'->'value'->>'amount')::numeric as tender_amount,
        (r.data->'planning'->'budget'->'amount'->>'amount')::numeric as budget_amount,
        r.data->'planning'->'budget'->'amount'->>'currency' as budget_currency,
        r.data->'tender'->'value'->>'currency' as tender_currency,
        (r.data->'tender'->>'datePublished')::timestamp as tender_date_published,
        (r.data->'planning'->>'estimatedDate')::timestamp as planning_estimated_date,
        (r.data->'tender'->'enquiryPeriod'->>'startDate')::timestamp as tender_enquiryperiod_start_date,
        (r.data->'tender'->'enquiryPeriod'->>'endDate')::timestamp as tender_enquiryperiod_end_date,
        (r.data->'tender'->'tenderPeriod'->>'endDate')::timestamp as tender_tenderperiod_end_date,
        (r.data->'tender'->'tenderPeriod'->>'startDate')::timestamp as tender_tenderperiod_start_date,
        lower(ocds.unaccent(r.data->'tender'->>'procurementMethodDetails')) as tender_procurementMethodDetails,
        lower(ocds.unaccent(r.data->'buyer'->>'name')) as buyer_name,
        (r.data->'buyer'->>'id') as buyer_id,
        (r.data->'tender'->'bidOpening'->>'date')::timestamp as tender_bidopening_date,
        lower(ocds.unaccent(r.data->'tender'->>'awardCriteriaDetails')) as tender_awardcriteria_details,
        r.data->'tender'->>'status' as tender_status,
        lower(ocds.unaccent(r.data->'tender'->>'statusDetails')) as tender_status_details,
        lower(ocds.unaccent(r.data->'tender'->>'title')) as tender_title,
        lower(ocds.unaccent(r.data->'tender'->>'mainProcurementCategoryDetails')) as tender_mainprocurementCategorydetails,
        r.data->'tender'->>'numberOfTenderers' as tender_numberoftenderers,
        COALESCE(jsonb_array_length(r.data->'awards'), 0) as number_of_awards,
        case when r.data->'tender'->'techniques'->'hasFrameworkAgreement' is not null
            then TRUE
            else FALSE
        end as convenio,
        case when r.data->'tender'->'techniques'->'hasElectronicAuction' is not null
            then TRUE
            else FALSE
        end as subasta,
        r.data->'planning'->'budget'->'budgetBreakdown' as budget,
        r.data->'tender'->'documents' as documents,
        COALESCE(jsonb_array_length(r.data->'tender'->'enquiries'), 0) as tender_numberofenquiries,
        case when r.data->'tender'->>'procurementMethod' = 'direct'
            then 'https://contrataciones.gov.py/sin-difusion-convocatoria/'|| (r.data->'tender'->>'id') || '.html'
            else 'https://contrataciones.gov.py/licitaciones/convocatoria/'|| (r.data->'tender'->>'id') || '.html'
        end as url,
        r.data->'tender'->>'procurementMethod' as procurement_method,
        r.data->'tender'->>'mainProcurementCategory' as mainprocurementcategory,
        r.data->'planning'->>'identifier' as planning_identifier
    FROM ocds.data AS r
    ORDER BY r.ocid, release_date DESC, r.id DESC
);

INSERT INTO ocds.planning_items (ocid, data_id, item_id, description, classification_id, classification_description) (
    SELECT DISTINCT ON (r.ocid)
    	r.ocid AS ocid,
        r.id AS data_id,
        a->>'id' AS item_id,
        lower(ocds.unaccent(a->>'description')) AS description,
        a->'classification'->>'id' AS classification_id,
        lower(ocds.unaccent(a->'classification'->>'description')) AS classification_description
    FROM ocds.data AS r
    CROSS JOIN jsonb_array_elements(data->'planning'->'items') a
    ORDER BY r.ocid, (r.data->>'date')::TIMESTAMP DESC, r.id DESC
);

INSERT INTO ocds.tender_items (ocid, data_id, item_id, description, classification_id, classification_description,
                                   quantity, unit_name, unit_price, unit_price_currency, attributes, lot) (
    SELECT DISTINCT ON (r.ocid)
        r.ocid AS ocid,
        r.id AS data_id,
        a->>'id' AS item_id,
        lower(ocds.unaccent(a->>'description' )) AS description,
        a->'classification'->>'id' AS classification_id,
        lower(ocds.unaccent(a->'classification'->>'description')) AS classification_description,
        (a->>'quantity')::NUMERIC AS quantity,
        lower(ocds.unaccent(a->'unit'->>'name')) AS unit_name,
        (a->'unit'->'value'->>'amount')::NUMERIC AS unit_price,
        a->'unit'->'value'->>'currency' AS unit_price_currency,
        a->'attributes' AS attributes,
        a->>'relatedLot' AS lot
    from ocds.data AS r
    CROSS JOIN jsonb_array_elements(data->'tender'->'items') a
    ORDER BY r.ocid, (r.data->>'date')::TIMESTAMP DESC, r.id DESC
);

INSERT INTO ocds.parties (ocid, data_id, party_id, name, contact_point_email, contact_point_name, contact_point_telephone,
                              contact_point_fax, roles, entity_level, entity_entity_type, entity_type, supplier_type,
                              address_country, address_locality, address_region, address_street)  (
    SELECT DISTINCT ON (r.ocid)
        r.ocid AS ocid,
        r.id AS data_id,
        p->>'id' AS party_id,
        lower(ocds.unaccent(p->>'name')) AS name,
        p->'contactPoint'->>'email' AS contact_point_email,
        p->'contactPoint'->>'name' AS contact_point_name,
        p->'contactPoint'->>'telephone' AS contact_point_telephone,
        p->'contactPoint'->>'faxNumber' AS contact_point_fax,
        p->'roles' AS roles,
        lower(ocds.unaccent(p->'details'->>'level')) AS entity_level,
        lower(ocds.unaccent(p->'details'->>'entityType')) AS entity_entity_type,
        lower(ocds.unaccent(p->'details'->>'type')) AS entity_type,
        lower(ocds.unaccent(p->'details'->>'legalEntityTypeDetail')) AS supplier_type,
        p->'address'->>'countryName' AS address_contry,
        p->'address'->>'locality' AS address_locality,
        p->'address'->>'region' AS address_region,
        p->'address'->>'streetAddress' AS address_street
    from ocds.data AS r
    CROSS JOIN jsonb_array_elements(data->'parties') p
    ORDER BY r.ocid, (r.data->>'date')::TIMESTAMP DESC, r.id DESC
);