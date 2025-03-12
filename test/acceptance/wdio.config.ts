// wdio.config.ts
import { ReportGenerator, HtmlReporter } from "wdio-html-nice-reporter";
let reportAggregator: ReportGenerator;

const BaseConfig: WebdriverIO.Config = {
  reporters: [
    "spec",
    [
      "html-nice",
      {
        outputDir: "./reports/html-reports/",
        filename: "report.html",
        reportTitle: "Test Report Title",
        linkScreenshots: true,
        //to show the report in a browser when done
        showInBrowser: true,
        collapseTests: false,
        //to turn on screenshots after every test
        useOnAfterCommandForScreenshot: false,

        //to initialize the logger
        LOG: log4j.getLogger("default"),
      },
    ],
  ],
};
