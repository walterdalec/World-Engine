/**
 * Benchmark Runner - World Engine
 * Collects and runs all benchmarks, compares against baselines
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import pathfindBench from './pathfind.bench';
import losBench from './los.bench';
import turnManagerBench from './turn_manager.bench';

interface BenchResult {
    name: string;
    opsPerSec: number;
    margin: number;
    samples: number;
    mean: number;
    median: number;
    min: number;
    max: number;
    p75: number;
    p99: number;
}

interface BenchSuite {
    name: string;
    timestamp: string;
    commit?: string;
    results: BenchResult[];
    metadata: {
        nodeVersion: string;
        platform: string;
        arch: string;
        cpus: number;
    };
}

interface PerformanceBudget {
    name: string;
    minOpsPerSec: number;
    description: string;
}

// Performance budgets as specified in the requirements
const PERFORMANCE_BUDGETS: PerformanceBudget[] = [
    {
        name: 'path 12 steps',
        minOpsPerSec: 150_000,
        description: 'Hex pathfinding for medium-range movement'
    },
    {
        name: 'LOS ray 10 hex',
        minOpsPerSec: 250_000,
        description: 'Line of sight calculation for ranged attacks'
    },
    {
        name: 'TurnManager.next() simple',
        minOpsPerSec: 500_000,
        description: 'Basic turn advancement in combat'
    }
];

const OUTPUT_DIR = './bench_out';
const BASELINE_FILE = './bench_baseline.json';

function formatOpsPerSec(ops: number): string {
    if (ops >= 1_000_000) {
        return `${(ops / 1_000_000).toFixed(1)}M ops/sec`;
    } else if (ops >= 1_000) {
        return `${(ops / 1_000).toFixed(1)}K ops/sec`;
    } else {
        return `${ops.toFixed(0)} ops/sec`;
    }
}

function checkPerformanceBudgets(results: BenchResult[]): { passed: boolean; failures: string[] } {
    const failures: string[] = [];

    for (const budget of PERFORMANCE_BUDGETS) {
        const result = results.find(r => r.name === budget.name);
        if (!result) {
            failures.push(`❌ Missing benchmark: ${budget.name}`);
            continue;
        }

        if (result.opsPerSec < budget.minOpsPerSec) {
            failures.push(
                `❌ ${budget.name}: ${formatOpsPerSec(result.opsPerSec)} < ${formatOpsPerSec(budget.minOpsPerSec)} (${budget.description})`
            );
        } else {
            console.log(`✅ ${budget.name}: ${formatOpsPerSec(result.opsPerSec)} >= ${formatOpsPerSec(budget.minOpsPerSec)}`);
        }
    }

    return { passed: failures.length === 0, failures };
}

function compareWithBaseline(current: BenchSuite, baseline: BenchSuite): void {
    console.log('\n📊 Baseline Comparison:');
    console.log(`Current: ${current.timestamp}`);
    console.log(`Baseline: ${baseline.timestamp}`);

    for (const currentResult of current.results) {
        const baselineResult = baseline.results.find(r => r.name === currentResult.name);
        if (!baselineResult) {
            console.log(`🆕 ${currentResult.name}: ${formatOpsPerSec(currentResult.opsPerSec)} (new benchmark)`);
            continue;
        }

        const changePercent = ((currentResult.opsPerSec - baselineResult.opsPerSec) / baselineResult.opsPerSec) * 100;
        const changeSymbol = changePercent > 10 ? '⬆️' : changePercent < -10 ? '⬇️' : '↔️';

        console.log(
            `${changeSymbol} ${currentResult.name}: ${formatOpsPerSec(currentResult.opsPerSec)} ` +
            `(${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}% vs baseline)`
        );

        // Alert on significant regressions
        if (changePercent < -20) {
            console.warn(`⚠️  Significant regression detected in ${currentResult.name}: ${changePercent.toFixed(1)}%`);
        }
    }
}

async function runBenchmark(bench: any, suiteName: string): Promise<BenchResult[]> {
    console.log(`\n🏃 Running ${suiteName} benchmarks...`);

    await bench.warmup();
    await bench.run();

    const results: BenchResult[] = [];

    for (const task of bench.tasks) {
        if (task.result) {
            const result: BenchResult = {
                name: task.name,
                opsPerSec: task.result.hz || 0,
                margin: task.result.rme || 0,
                samples: task.result.samples?.length || 0,
                mean: task.result.mean || 0,
                median: task.result.samples ?
                    task.result.samples.sort((a: number, b: number) => a - b)[Math.floor(task.result.samples.length / 2)] : 0,
                min: Math.min(...(task.result.samples || [0])),
                max: Math.max(...(task.result.samples || [0])),
                p75: task.result.samples ?
                    task.result.samples.sort((a: number, b: number) => a - b)[Math.floor(task.result.samples.length * 0.75)] : 0,
                p99: task.result.samples ?
                    task.result.samples.sort((a: number, b: number) => a - b)[Math.floor(task.result.samples.length * 0.99)] : 0
            };

            results.push(result);
            console.log(`  ${task.name}: ${formatOpsPerSec(result.opsPerSec)} ±${result.margin.toFixed(2)}%`);
        }
    }

    return results;
}

async function main() {
    const isCI = process.argv.includes('--ci');
    const updateBaseline = process.argv.includes('--update-baseline');

    console.log('🚀 World Engine Performance Benchmarks');
    console.log(`Mode: ${isCI ? 'CI' : 'Development'}`);

    // Collect system information
    const metadata = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cpus: require('os').cpus().length
    };

    console.log(`\n💻 System Info:`);
    console.log(`  Node.js: ${metadata.nodeVersion}`);
    console.log(`  Platform: ${metadata.platform} ${metadata.arch}`);
    console.log(`  CPUs: ${metadata.cpus}`);

    // Run all benchmark suites
    const allResults: BenchResult[] = [];

    allResults.push(...await runBenchmark(pathfindBench, 'Pathfinding'));
    allResults.push(...await runBenchmark(losBench, 'Line of Sight'));
    allResults.push(...await runBenchmark(turnManagerBench, 'Turn Manager'));

    // Create result suite
    const suite: BenchSuite = {
        name: 'World Engine Benchmarks',
        timestamp: new Date().toISOString(),
        commit: process.env.GITHUB_SHA?.substring(0, 7),
        results: allResults,
        metadata
    };

    // Save results
    if (!existsSync(OUTPUT_DIR)) {
        require('fs').mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const filename = isCI ?
        `bench.${suite.commit || 'local'}.json` :
        `bench.${new Date().toISOString().split('T')[0]}.json`;

    const outputPath = join(OUTPUT_DIR, filename);
    writeFileSync(outputPath, JSON.stringify(suite, null, 2));
    console.log(`\n💾 Results saved to: ${outputPath}`);

    // Check performance budgets
    console.log('\n🎯 Performance Budget Check:');
    const budgetCheck = checkPerformanceBudgets(allResults);

    if (!budgetCheck.passed) {
        console.error('\n❌ Performance budget failures:');
        budgetCheck.failures.forEach(failure => console.error(`  ${failure}`));
    } else {
        console.log('✅ All performance budgets passed!');
    }

    // Compare with baseline if it exists
    if (existsSync(BASELINE_FILE)) {
        try {
            const baseline: BenchSuite = JSON.parse(readFileSync(BASELINE_FILE, 'utf-8'));
            compareWithBaseline(suite, baseline);
        } catch (error) {
            console.warn('⚠️  Could not load baseline file:', error);
        }
    } else {
        console.log('\n📋 No baseline file found. Run with --update-baseline to create one.');
    }

    // Update baseline if requested
    if (updateBaseline) {
        writeFileSync(BASELINE_FILE, JSON.stringify(suite, null, 2));
        console.log(`\n📊 Baseline updated: ${BASELINE_FILE}`);
    }

    // Exit with error code if CI and budgets failed
    if (isCI && !budgetCheck.passed) {
        process.exit(1);
    }

    console.log('\n🏁 Benchmarks complete!');
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Benchmark runner failed:', error);
        process.exit(1);
    });
}

export { runBenchmark, checkPerformanceBudgets, compareWithBaseline };