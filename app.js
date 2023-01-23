// imports
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const fs = require("fs").promises;
const puppeteer = require("puppeteer");
const DOMAIN_NAME = "docstation.co";
const URL = "https://docstation.co";
const sequelize = require("./db");

// const DOMAIN_NAME = "impaclift.com";
// const URL = "https://impaclift.com";

// Constants
const timestamp = String(new Date().getTime());
const projectName = "XXSSZZZSASW";
const taskName = "Test_Task";
const list = "./list.txt";
const account = "syed.ashraf@mediamint.com";
const destination = "ScreamingFrogSEOSpider.exe";
const config = "./js.seospiderconfig";

// Services
const robotsFileMissing = require("./services/robotsFileMissing");
const sitemapAccessibleInRobots = require("./services/sitemapAccessibleInRobots");
const sitemapAccessible = require("./services/sitemapAccessible");
const nonIndexableInSitemap = require("./services/nonIndexableInSitemap");
const getFileContents = require("./services/getFileContents");
const pageCanonicalization = require("./services/pageCanonicalization");
const siteErrors = require("./services/siteErrors");
const webPerformance = require("./services/webPerformance");
const pageTitleErrors = require("./services/pageTitleErrors");
const metaDescriptionErrors = require("./services/metaDescriptionErrors");
const unnecessaryRedirects = require("./services/unnecessaryRedirects");
const internalLinkIssue = require("./services/internalLinkIssue");
const populate = require("./services/populate");
// Command
// const CMD = `${destination} --crawl-list ${list}  --config ${config}  --headless   --save-crawl  --save-report "Crawl Overview,Canonicals:Canonical Chains" --google-drive-account  ${account} --project-name ${projectName} --task-name ${taskName}_${timestamp} --export-format gsheet --overwrite   --export-tabs "Internal:All,External:All,Security:All" `;

const CMD = `${destination} --load-crawl ${"./sf_output/crawl.seospider"}  --config ${config}  --headless  --save-crawl --export-format csv --output-folder ./sf_output --overwrite --use-pagespeed --save-report "Hreflang:Inconsistent Language & Region Return Links,Hreflang:Missing Return Links,Hreflang:Noindex Return Links,Hreflang:Non Canonical Return Links,Hreflang:Non-200 Hreflang URLs,Hreflang:Unlinked hreflang URLs,Redirects:All Redirects,Structured Data:Validation Errors & Warnings,Crawl Overview"  --export-tabs "Internal:All,Internal:HTML,External:All,Sitemaps:All,Page Titles:Missing,Page Titles:Duplicate,Page Titles:All,Meta Description:Missing,Meta Description:Duplicate,Meta Description:All,Canonicals:Canonicalised,Canonicals:Missing,Canonicals:Multiple,Content:All,Directives:Nofollow,Directives:Noindex,H1:All,Hreflang:Missing,Internal:HTML,JavaScript:All,Response Codes:Blocked by Robots.txt,Search Console:All,Sitemaps:Non-Indexable URLs in Sitemap,Sitemaps:Orphan URLs,Sitemaps:URLs not in Sitemap,Structured Data:Missing,URL:Parameters" --bulk-export "Content:Near Duplicates,Images:All Image Inlinks,Images:Images Missing Alt Text Inlinks,Images:Images Over X KB Inlinks,Links:All Inlinks,Response Codes:Client Error (4xx) Inlinks,Response Codes:Redirection (JavaScript) Inlinks,Response Codes:Redirection (Meta Refresh) Inlinks,Response Codes:Server Error (5xx) Inlinks"`;

// Executing the command
async function start() {
  try {
    // Syncing the database
    await sequelize.sync({ force: true });
    const { stdout, stderr } = await exec(CMD);
    console.log("Crawling Finished");
    // Checking if crawl was successful
    const internal = await getFileContents("./sf_output/internal_all.csv");
    if (internal.length < 2) {
      return "RESTART";
    }

    const timestamp = +new Date();

    //Populating the database
    await populate(URL, timestamp);
    console.log("Populated");

    //Starting Puppeteer
    // const browser = await puppeteer.launch({
    // headless: false,
    // defaultViewport: null,
    // });
    // var [page] = await browser.pages();

    // Crawling Robots.txt
    // const robots = await robotsFileMissing(URL, page);
    // console.log("Robots.txt:", robots);

    // Sitemap XML is referenced in the robots.txt file
    // const sitemapInRobots = await sitemapAccessibleInRobots(URL, page);
    // console.log("Sitemap.xml:", sitemapInRobots);

    // Checking if sitemap.xml is accessible
    // const sitemap = await sitemapAccessible(URL, page);
    // console.log("Sitemap.xml:", sitemap);

    //Checking Page Canonicalization Issue
    // const issue = await pageCanonicalization(DOMAIN_NAME, page);
    // console.log("Page Canonicalization Issue:", issue);

    const res = await Promise.all([
      nonIndexableInSitemap(timestamp, URL),
      siteErrors(timestamp, URL, DOMAIN_NAME),
      webPerformance(timestamp, URL),
      pageTitleErrors(timestamp, URL),
      metaDescriptionErrors(timestamp, URL),
      unnecessaryRedirects(timestamp, URL, DOMAIN_NAME),
      internalLinkIssue(timestamp, URL),
    ]);
    console.log(res);

    // Closing the browser
    // await browser.close();
    return true;
  } catch (err) {
    console.log("ERR OCCURED", err);
  }
}

(async function () {
  let RESTART = 0;
  while (RESTART < 3) {
    console.log(`STARTING ${RESTART}`);
    const res = await start();
    if (res === "RESTART") {
      RESTART++;
    } else {
      console.log("DONE");
      RESTART = 3;
    }
    if (res === "RESTART" && RESTART === 3) {
      console.log("Exiting. Some Problem Occured with Screaming Frog");
    }
  }
})();
