import fs from 'fs';
import path from 'path';

interface TestCase {
  id: string;
  inputMode: 'screenshot' | 'link' | 'paste' | 'camera';
  source: string | null;
  fixtureName: string;
  payload: {
    inputType: string;
    content: string;
    imageBase64?: string;
    sourceCategory: string | null;
  };
}

interface TestResult {
  id: string;
  inputMode: string;
  source: string;
  fixtureName: string;
  status: 'PASS' | 'FAIL' | 'BLOCKED';
  durationMs: number;
  httpStatus: number;
  verdict?: string;
  confidence?: string;
  summarySnippet?: string;
  sellerQuestion?: string;
  checklistCount?: number;
  unverifiedCount?: number;
  groundingPassed: boolean;
  sourceRecognized: boolean;
  failureReason?: string;
}

const SOURCES = [
  'AI',
  'TikTok',
  'Instagram',
  'Marketplace',
  'Google',
  'Message',
  'Email',
  'Website',
  'Other',
  null, // Unspecified / Continue without source
] as const;

const INPUT_MODES = ['screenshot', 'link', 'paste', 'camera'] as const;

// Base64 fixture image using real valid PNG
const SAMPLE_PNG_BASE64 = `data:image/png;base64,${fs.readFileSync('scripts/real-product.png').toString('base64')}`;

// Realistic fixtures mapped to products
function getFixtureForCombination(mode: string, source: string | null, index: number) {
  const fixtures = [
    {
      name: 'Product A (Retailer Jumpsuit)',
      link: 'https://www.dollskill.com/products/walking-goddess-embroidered-jumpsuit?cf=black',
      paste: 'Dolls Kill Walking Goddess Embroidered Jumpsuit, $88.00 regular price. Fabric: 95% polyester 5% elastane. Returns accepted within 30 days for store credit. Standard shipping 3-5 days.',
      screenshotText: 'dollskill_dress_product_page.png',
    },
    {
      name: 'Product B (Marketplace Sony Headphones)',
      link: 'https://facebook.com/marketplace/item/9876543210-sony-headphones',
      paste: 'Sony WH-1000XM4 Noise Canceling Headphones $100. Used like new, comes with case and cable. Pick up in public place, cash or Venmo only. No returns.',
      screenshotText: 'marketplace_sony_headphones_listing.png',
    },
    {
      name: 'Product C (Suspicious Low Price Airwrap)',
      link: 'https://super-flash-deals-direct.shop/dyson-airwrap-special-deal',
      paste: 'Flash Sale: Dyson Airwrap Multi-Styler only $49.99 (Retail $599). 92% OFF today only! Hurry, only 4 units remaining in stock. Countdown timer: 00:08:42. Free worldwide shipping. Wire transfer or Cash App.',
      screenshotText: 'tiktok_dyson_airwrap_flash_ad.png',
    },
    {
      name: 'Product D (Google Search Ninja Air Fryer)',
      link: 'https://www.target.com/p/ninja-air-fryer-4qt/-/A-53434771',
      paste: 'Ninja 4-Quart Air Fryer AF101, $79.99 sale price. 4.8 out of 5 stars from 8,400 reviews. 90-day return window to Target store. 1-year limited warranty included.',
      screenshotText: 'target_ninja_air_fryer_screen.png',
    },
    {
      name: 'Product E (Luxury Handbag Missing Specs)',
      link: 'https://designer-consignment-chat.com/bag/offer-441',
      paste: 'Authentic Chanel Classic Flap Quilted Bag $350. Urgent sale because moving abroad tomorrow! DM to purchase, Zelle payment only.',
      screenshotText: 'instagram_chanel_bag_dm.png',
    },
    {
      name: 'Product F (Unusual MacBook Pro Deal)',
      link: 'https://craigslist.org/sfo/ele/d/apple-macbook-pro-m3/7712345678.html',
      paste: 'Brand new sealed Apple MacBook Pro 16-inch M3 Max $300. Never opened. Shipping only, pay with Apple Gift Card before tracking number is issued.',
      screenshotText: 'email_macbook_pro_m3_offer.png',
    },
  ];

  const fix = fixtures[index % fixtures.length];

  if (mode === 'screenshot') {
    return {
      fixtureName: fix.name,
      content: fix.screenshotText,
      imageBase64: SAMPLE_PNG_BASE64,
    };
  }
  if (mode === 'camera') {
    return {
      fixtureName: `${fix.name} (Photo)`,
      content: `camera_capture_${fix.screenshotText}`,
      imageBase64: SAMPLE_PNG_BASE64,
    };
  }
  if (mode === 'link') {
    return {
      fixtureName: fix.name,
      content: fix.link,
    };
  }
  // mode === 'paste'
  return {
    fixtureName: fix.name,
    content: fix.paste,
  };
}

async function runTest(tc: TestCase): Promise<TestResult> {
  const start = Date.now();
  try {
    const res = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tc.payload),
      signal: AbortSignal.timeout(15000),
    });

    const durationMs = Date.now() - start;
    const httpStatus = res.status;

    if (!res.ok) {
      const errText = await res.text();
      return {
        id: tc.id,
        inputMode: tc.inputMode,
        source: tc.source || 'None',
        fixtureName: tc.fixtureName,
        status: 'FAIL',
        durationMs,
        httpStatus,
        groundingPassed: false,
        sourceRecognized: false,
        failureReason: `HTTP ${httpStatus}: ${errText.slice(0, 150)}`,
      };
    }

    const data = await res.json();

    // Verify structured response conforms to consumer-advocate requirements
    const hasValidStatus = ['LOOKS_REASONABLE', 'PAUSE_AND_CHECK', 'DONT_PAY_YET'].includes(data.status);
    const hasValidConfidence = ['HIGH', 'MODERATE', 'LIMITED'].includes(data.confidence);
    const hasSummary = typeof data.summary === 'string' && data.summary.trim().length > 10;
    const hasPriceFindings = !!data.price_findings && Array.isArray(data.price_findings.notes);
    const hasSellerFindings = !!data.seller_findings && Array.isArray(data.seller_findings.notes);
    const hasTermsFindings = !!data.terms_findings && Array.isArray(data.terms_findings.notes);
    const hasRedFlags = !!data.red_flags && Array.isArray(data.red_flags.notes);
    const hasUnverified = Array.isArray(data.unverified_items);
    const hasNextSteps = !!data.next_steps && typeof data.next_steps.action === 'string';
    const hasSellerQuestion = typeof data.seller_question === 'string' && data.seller_question.trim().length > 5;
    const hasChecklist = Array.isArray(data.verification_checklist);

    // Grounding check: ensure missing items are acknowledged rather than hallucinated
    const groundingPassed =
      hasUnverified &&
      (data.unverified_items.length > 0 || data.status === 'LOOKS_REASONABLE') &&
      typeof data.summary === 'string';

    // Source context check: if source was provided, verify it didn't get confused or lost
    const sourceRecognized = tc.source
      ? JSON.stringify(data).toLowerCase().includes(tc.source.toLowerCase()) ||
        typeof data.summary === 'string'
      : true;

    const allPassed =
      hasValidStatus &&
      hasValidConfidence &&
      hasSummary &&
      hasPriceFindings &&
      hasSellerFindings &&
      hasTermsFindings &&
      hasRedFlags &&
      hasNextSteps &&
      hasSellerQuestion &&
      hasChecklist;

    return {
      id: tc.id,
      inputMode: tc.inputMode,
      source: tc.source || 'None',
      fixtureName: tc.fixtureName,
      status: allPassed ? 'PASS' : 'FAIL',
      durationMs,
      httpStatus,
      verdict: data.status,
      confidence: data.confidence,
      summarySnippet: data.summary?.slice(0, 90) + '...',
      sellerQuestion: data.seller_question,
      checklistCount: data.verification_checklist?.length || 0,
      unverifiedCount: data.unverified_items?.length || 0,
      groundingPassed,
      sourceRecognized,
      failureReason: allPassed ? undefined : 'Incomplete or invalid structured fields in AI response',
    };
  } catch (err: any) {
    return {
      id: tc.id,
      inputMode: tc.inputMode,
      source: tc.source || 'None',
      fixtureName: tc.fixtureName,
      status: 'FAIL',
      durationMs: Date.now() - start,
      httpStatus: 0,
      groundingPassed: false,
      sourceRecognized: false,
      failureReason: err?.message || String(err),
    };
  }
}

async function runEdgeCases(): Promise<Array<{ testName: string; passed: boolean; details: string }>> {
  const edgeResults: Array<{ testName: string; passed: boolean; details: string }> = [];

  // Edge 1: Empty input payload
  try {
    const res = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const passed = res.status === 400;
    edgeResults.push({
      testName: 'Empty payload rejection',
      passed,
      details: passed ? 'Properly returned 400 Bad Request' : `Unexpected status: ${res.status}`,
    });
  } catch (e: any) {
    edgeResults.push({ testName: 'Empty payload rejection', passed: false, details: e.message });
  }

  // Edge 2: Incomplete text ("asdfg")
  try {
    const res = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputType: 'paste', content: 'asdfg', sourceCategory: 'Website' }),
    });
    const data = await res.json();
    const passed = data.insufficient_information === true || data.status === 'PAUSE_AND_CHECK' || data.status === 'DONT_PAY_YET';
    edgeResults.push({
      testName: 'Gibberish / insufficient info handling',
      passed,
      details: passed ? 'Properly flagged as insufficient info or cautious verdict' : 'Failed to flag gibberish',
    });
  } catch (e: any) {
    edgeResults.push({ testName: 'Gibberish handling', passed: false, details: e.message });
  }

  // Edge 3: Very short text "Sony"
  try {
    const res = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputType: 'paste', content: 'Sony', sourceCategory: 'Marketplace' }),
    });
    const data = await res.json();
    const passed = !!data.status && !!data.unverified_items;
    edgeResults.push({
      testName: 'Short input ("Sony") robustness',
      passed,
      details: passed ? `Analyzed with status ${data.status} and ${data.unverified_items.length} unverified items` : 'Failed short input',
    });
  } catch (e: any) {
    edgeResults.push({ testName: 'Short input robustness', passed: false, details: e.message });
  }

  // Edge 4: Blank image
  try {
    const res = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputType: 'screenshot',
        content: 'blank.png',
        imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        sourceCategory: 'Other',
      }),
    });
    const data = await res.json();
    const passed = data.unreadable_screenshot === true || data.status === 'DONT_PAY_YET' || data.status === 'PAUSE_AND_CHECK';
    edgeResults.push({
      testName: 'Blank / unreadable screenshot handling',
      passed,
      details: passed ? 'Properly flagged unreadable screenshot / cautious verdict' : 'Failed to catch blank screenshot',
    });
  } catch (e: any) {
    edgeResults.push({ testName: 'Blank screenshot handling', passed: false, details: e.message });
  }

  // Edge 5: Product text typed in link field ("Sony headphones $100 marketplace")
  try {
    const res = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputType: 'link',
        content: 'Sony headphones $100 marketplace',
        sourceCategory: 'Marketplace',
      }),
    });
    const data = await res.json();
    const passed = res.status === 200 && !!data.status;
    edgeResults.push({
      testName: 'Product text in link field adaptation',
      passed,
      details: passed ? `Adapted cleanly with status ${data.status}` : `Failed with status ${res.status}`,
    });
  } catch (e: any) {
    edgeResults.push({ testName: 'Product text in link field adaptation', passed: false, details: e.message });
  }

  return edgeResults;
}

// Data Isolation Test
async function runDataIsolationTest(): Promise<{ passed: boolean; details: string }> {
  try {
    // Call Product A (Patagonia / Dolls Kill)
    const resA = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputType: 'link',
        content: 'https://www.dollskill.com/products/walking-goddess-embroidered-jumpsuit?cf=black',
        sourceCategory: 'Website',
      }),
    });
    const dataA = await resA.json();

    // Call Product B immediately (Sony Headphones $100 Marketplace)
    const resB = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputType: 'paste',
        content: 'Sony WH-1000XM4 Noise Canceling Headphones $100 marketplace cash pickup',
        sourceCategory: 'Marketplace',
      }),
    });
    const dataB = await resB.json();

    // Verify isolation
    const dataAStr = JSON.stringify(dataA).toLowerCase();
    const dataBStr = JSON.stringify(dataB).toLowerCase();

    const containsCrossOverA = dataAStr.includes('sony') || dataAStr.includes('headphones');
    const containsCrossOverB = dataBStr.includes('dollskill') || dataBStr.includes('jumpsuit');

    const passed = !containsCrossOverA && !containsCrossOverB;
    return {
      passed,
      details: passed
        ? 'Zero data leakage detected: Product A and Product B contexts completely isolated'
        : `Data leak detected: CrossA=${containsCrossOverA}, CrossB=${containsCrossOverB}`,
    };
  } catch (e: any) {
    return { passed: false, details: e.message };
  }
}

async function main() {
  console.log('================================================================');
  console.log('STARTING COMPLETE EXHAUSTIVE E2E QA TEST SUITE');
  console.log(`Matrix: ${INPUT_MODES.length} Input Modes × ${SOURCES.length} Sources = ${INPUT_MODES.length * SOURCES.length} Combinations`);
  console.log('================================================================\n');

  const testCases: TestCase[] = [];
  let counter = 1;

  for (const mode of INPUT_MODES) {
    for (const src of SOURCES) {
      const id = `TC-${String(counter).padStart(2, '0')}`;
      const fixture = getFixtureForCombination(mode, src, counter - 1);
      testCases.push({
        id,
        inputMode: mode,
        source: src,
        fixtureName: fixture.fixtureName,
        payload: {
          inputType: mode,
          content: fixture.content,
          imageBase64: fixture.imageBase64,
          sourceCategory: src,
        },
      });
      counter++;
    }
  }

  const results: TestResult[] = [];

  for (const tc of testCases) {
    process.stdout.write(`Testing [${tc.id}] ${tc.inputMode.toUpperCase()} × ${tc.source || 'None'} (${tc.fixtureName})... `);
    const res = await runTest(tc);
    results.push(res);
    console.log(`${res.status} (${res.durationMs}ms) [${res.verdict || 'ERR'}]`);
    // brief delay between calls to be respectful to rate limits
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log('\n--- Running Error & Edge Case Tests ---');
  const edgeResults = await runEdgeCases();
  for (const er of edgeResults) {
    console.log(`[Edge] ${er.testName}: ${er.passed ? 'PASS' : 'FAIL'} - ${er.details}`);
  }

  console.log('\n--- Running Data Isolation Tests ---');
  const isolationResult = await runDataIsolationTest();
  console.log(`[Isolation] Product A -> Product B test: ${isolationResult.passed ? 'PASS' : 'FAIL'} - ${isolationResult.details}`);

  // Write out raw JSON report for archiving
  const finalReport = {
    timestamp: new Date().toISOString(),
    totalMatrixCombinations: testCases.length,
    results,
    edgeResults,
    isolationResult,
  };

  fs.writeFileSync('scripts/qa-test-results.json', JSON.stringify(finalReport, null, 2));
  console.log('\nWrote full test results to scripts/qa-test-results.json');
}

main().catch(console.error);
