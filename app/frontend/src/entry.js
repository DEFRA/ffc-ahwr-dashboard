import { initAll } from 'govuk-frontend'
import "./css/application.scss";
import "./css/document-list.scss";
import "./css/devolved-nations.scss";
import "./css/contents-list.scss";
import "./css/print-link.scss";
import "./css/govspeak.scss";
import "./css/organisation-logo.scss";
import "./js/cookies.js";
import "./js/handleDuplicateFormSubmissions.js";
import jquery from "jquery";
import moj from "@ministryofjustice/frontend";

initAll()

window.$ = jquery;

const $sortableTables = document.querySelectorAll(
  '[data-module="moj-sortable-table"]',
);
moj.nodeListForEach(
  $sortableTables,
  (table) => new moj.SortableTable({ table }),
);
