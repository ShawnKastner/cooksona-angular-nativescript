#!/usr/bin/env node

/**
 * Accessibility testing script using axe-core
 * Tests the application for WCAG 2.1 AA compliance
 */

const { AxePuppeteer } = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:4200';
const REPORT_DIR = path.join(__dirname, '../a11y-reports');

// Pages to test
const PAGES = [
  { path: '/landing', name: 'Landing Page' },
  { path: '/login', name: 'Login Page' },
  { path: '/register', name: 'Register Page' },
  { path: '/barrierefreiheit', name: 'Accessibility Statement' },
  { path: '/contact', name: 'Contact Page' },
  { path: '/datenschutz', name: 'Privacy Policy' },
  { path: '/impressum', name: 'Imprint' },
];

async function ensureReportDir() {
  try {
    await fs.mkdir(REPORT_DIR, { recursive: true });
    await fs.mkdir(path.join(REPORT_DIR, 'screenshots'), { recursive: true });
  } catch (error) {
    console.error('Failed to create report directory:', error);
  }
}

async function testPage(browser, page, pagePath, pageName) {
  console.log(`\n🔍 Testing: ${pageName} (${pagePath})`);

  try {
    const url = `${BASE_URL}${pagePath}`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait a bit for dynamic content
    await page.waitForTimeout(2000);

    // Run axe
    const results = await new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Take screenshot
    const screenshotPath = path.join(
      REPORT_DIR,
      'screenshots',
      `${pagePath.replace(/\//g, '_')}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Process results
    const violations = results.violations || [];
    const passes = results.passes || [];
    const incomplete = results.incomplete || [];

    console.log(`  ✅ Passes: ${passes.length}`);
    console.log(`  ⚠️  Incomplete: ${incomplete.length}`);
    console.log(`  ❌ Violations: ${violations.length}`);

    if (violations.length > 0) {
      console.log('\n  Violations:');
      violations.forEach((violation, index) => {
        console.log(`\n  ${index + 1}. ${violation.id}: ${violation.description}`);
        console.log(`     Impact: ${violation.impact}`);
        console.log(`     Help: ${violation.helpUrl}`);
        console.log(`     Elements affected: ${violation.nodes.length}`);
        violation.nodes.slice(0, 3).forEach((node) => {
          console.log(`       - ${node.html.substring(0, 100)}...`);
        });
      });
    }

    return {
      pageName,
      pagePath,
      url,
      violations,
      passes,
      incomplete,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`  ❌ Error testing ${pageName}:`, error.message);
    return {
      pageName,
      pagePath,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

async function generateReport(allResults) {
  const totalViolations = allResults.reduce(
    (sum, r) => sum + (r.violations?.length || 0),
    0
  );
  const totalPasses = allResults.reduce(
    (sum, r) => sum + (r.passes?.length || 0),
    0
  );

  const reportHtml = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Test Report - CookSona</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: #f5f5f5;
    }
    h1 { color: #1a202c; margin-bottom: 0.5rem; }
    h2 { color: #2d3748; margin-top: 2rem; }
    h3 { color: #4a5568; }
    .summary {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .summary-stat {
      display: inline-block;
      margin-right: 2rem;
      font-size: 1.25rem;
    }
    .page-result {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .violation {
      background: #fff5f5;
      border-left: 4px solid #e53e3e;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 4px;
    }
    .pass { color: #38a169; }
    .fail { color: #e53e3e; }
    .warning { color: #d69e2e; }
    .impact-critical { color: #c53030; font-weight: bold; }
    .impact-serious { color: #e53e3e; font-weight: bold; }
    .impact-moderate { color: #d69e2e; }
    .impact-minor { color: #718096; }
    code {
      background: #edf2f7;
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      font-size: 0.875rem;
    }
    .screenshot {
      max-width: 100%;
      margin-top: 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <h1>🔍 Accessibility Test Report</h1>
  <p>Generated: ${new Date().toLocaleString('de-DE')}</p>
  
  <div class="summary">
    <h2>Summary</h2>
    <div class="summary-stat">
      <strong class="${totalViolations === 0 ? 'pass' : 'fail'}">
        ${totalViolations}
      </strong> Total Violations
    </div>
    <div class="summary-stat">
      <strong class="pass">${totalPasses}</strong> Total Passes
    </div>
    <div class="summary-stat">
      <strong>${allResults.length}</strong> Pages Tested
    </div>
  </div>

  ${allResults
    .map(
      (result) => `
    <div class="page-result">
      <h2>${result.pageName}</h2>
      <p><strong>Path:</strong> <code>${result.pagePath}</code></p>
      
      ${
        result.error
          ? `<p class="fail"><strong>Error:</strong> ${result.error}</p>`
          : `
      <p>
        <span class="pass">✅ ${result.passes?.length || 0} passes</span> | 
        <span class="warning">⚠️ ${result.incomplete?.length || 0} incomplete</span> | 
        <span class="fail">❌ ${result.violations?.length || 0} violations</span>
      </p>

      ${
        result.violations && result.violations.length > 0
          ? `
        <h3>Violations</h3>
        ${result.violations
          .map(
            (v) => `
          <div class="violation">
            <h4>
              <span class="impact-${v.impact}">${v.impact.toUpperCase()}</span>
              - ${v.id}
            </h4>
            <p><strong>Description:</strong> ${v.description}</p>
            <p><strong>Help:</strong> <a href="${v.helpUrl}" target="_blank">${v.helpUrl}</a></p>
            <p><strong>Elements affected:</strong> ${v.nodes.length}</p>
            ${v.nodes
              .slice(0, 3)
              .map(
                (node) => `
              <div style="margin-top: 0.5rem;">
                <code>${node.html.substring(0, 200)}...</code>
                <p style="margin-top: 0.25rem; font-size: 0.875rem; color: #718096;">
                  ${node.failureSummary}
                </p>
              </div>
            `
              )
              .join('')}
          </div>
        `
          )
          .join('')}
      `
          : '<p class="pass">✅ No violations found!</p>'
      }
      `
      }
    </div>
  `
    )
    .join('')}

  <footer style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; color: #718096;">
    <p>
      This report tests compliance with WCAG 2.1 Level AA standards using axe-core.
      For complete accessibility compliance, manual testing with screen readers is also required.
    </p>
  </footer>
</body>
</html>
  `;

  const reportPath = path.join(REPORT_DIR, 'accessibility-report.html');
  await fs.writeFile(reportPath, reportHtml);

  // Also save JSON
  const jsonPath = path.join(REPORT_DIR, 'accessibility-report.json');
  await fs.writeFile(jsonPath, JSON.stringify(allResults, null, 2));

  console.log(`\n📊 Report saved to: ${reportPath}`);
  console.log(`📊 JSON data saved to: ${jsonPath}`);
}

async function main() {
  console.log('🚀 Starting Accessibility Tests');
  console.log(`Base URL: ${BASE_URL}\n`);

  await ensureReportDir();

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const allResults = [];

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    for (const pageConfig of PAGES) {
      const result = await testPage(
        browser,
        page,
        pageConfig.path,
        pageConfig.name
      );
      allResults.push(result);
    }

    await generateReport(allResults);

    const totalViolations = allResults.reduce(
      (sum, r) => sum + (r.violations?.length || 0),
      0
    );

    console.log('\n' + '='.repeat(50));
    console.log(
      totalViolations === 0
        ? '✅ All tests passed! No accessibility violations found.'
        : `❌ Found ${totalViolations} accessibility violations.`
    );
    console.log('='.repeat(50));

    // Exit with error code if violations found
    if (totalViolations > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
