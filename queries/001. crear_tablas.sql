CREATE SCHEMA IF NOT EXISTS ocds;

CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA ocds;

CREATE TABLE IF NOT EXISTS ocds.data (
	data        JSONB NULL,
	release_id  TEXT NULL,
	ocid        TEXT NULL,
	id          BIGSERIAL,
	CONSTRAINT data_pk PRIMARY KEY (id),
    CONSTRAINT ocid_uniq UNIQUE (ocid)
);

COMMENT ON TABLE ocds.data
    IS 'Tabla donde se almacenan los compiled releases del ocds';

CREATE TABLE IF NOT EXISTS ocds.procurement
(
    release_date                          TIMESTAMP,
    ocid                                  TEXT,
    tender_id                             TEXT,
    characteristics                       JSONB,
    tender_amount                         NUMERIC,
    budget_amount                         NUMERIC,
    budget_currency                       TEXT,
    tender_currency                       TEXT,
    tender_date_published                 TIMESTAMP,
    planning_estimated_date               TIMESTAMP,
    tender_enquiryperiod_start_date       TIMESTAMP,
    tender_enquiryperiod_end_date         TIMESTAMP,
    tender_tenderperiod_end_date          TIMESTAMP,
    tender_tenderperiod_start_date        TIMESTAMP,
    tender_procurementmethoddetails       TEXT,
    buyer_name                            TEXT,
    buyer_id                              TEXT,
    tender_bidopening_date                TIMESTAMP,
    tender_awardcriteria_details          TEXT,
    tender_status                         TEXT,
    tender_status_details                 TEXT,
    tender_title                          TEXT,
    tender_mainprocurementcategorydetails TEXT,
    tender_numberoftenderers              TEXT,
    number_of_awards                      INTEGER,
    framework_agreement                   BOOLEAN,
    electronic_auction                    BOOLEAN,
    budget                                JSONB,
    documents                             JSONB,
    tender_numberofenquiries              INTEGER,
    url                                   TEXT,
    tender_procurementmethod              TEXT,
    tender_mainprocurementcategory        TEXT,
    planning_identifier                   TEXT,
    id                                    BIGSERIAL,
    data_id                               BIGINT,
    CONSTRAINT procurement_pk PRIMARY KEY (id)
);

COMMENT ON TABLE ocds.procurement
    IS 'Tabla donde se almacenan los metadatos y las secciones de buyer, tender y planning del compiled release';

CREATE TABLE IF NOT EXISTS ocds.planning_items
(
    ocid                       TEXT,
    item_id                    TEXT,
    description                TEXT,
    classification_id          TEXT,
    classification_description TEXT,
    id                         BIGSERIAL,
    data_id                    BIGINT,
    CONSTRAINT planning_items_pk PRIMARY KEY (id)
);

COMMENT ON TABLE ocds.planning_items
    IS 'Tabla donde se almacena el bloque de items de la sección planning del compiled release';

CREATE TABLE IF NOT EXISTS ocds.tender_items
(
    ocid                       TEXT,
    item_id                    TEXT,
    description                TEXT,
    classification_id          TEXT,
    classification_description TEXT,
    quantity                   NUMERIC,
    unit_name                  TEXT,
    unit_price                 NUMERIC,
    unit_price_currency        TEXT,
    attributes                 JSONB,
    lot                        TEXT,
    id                         BIGSERIAL,
    data_id                    BIGINT,
    CONSTRAINT tender_items_pk PRIMARY KEY (id)
);

COMMENT ON TABLE ocds.tender_items
    IS 'Tabla donde se almacena el bloque de items de la sección tender del compiled release';

CREATE TABLE IF NOT EXISTS ocds.parties
(
    ocid                    TEXT,
    party_id                TEXT,
    name                    TEXT,
    contact_point_email     TEXT,
    contact_point_name      TEXT,
    contact_point_telephone TEXT,
    contact_point_fax       TEXT,
    roles                   JSONB,
    entity_level            TEXT,
    entity_entity_type      TEXT,
    entity_type             TEXT,
    supplier_type           TEXT,
    address_country         TEXT,
    address_locality        TEXT,
    address_region          TEXT,
    address_street          TEXT,
    id                      BIGSERIAL,
    data_id                 BIGINT,
    CONSTRAINT parties_pk PRIMARY KEY (id)
);

COMMENT ON TABLE ocds.parties
    IS 'Tabla donde se almacena la sección parties del compiled release';
