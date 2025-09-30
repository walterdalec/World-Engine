/**
 * Optimizes SVG content by:
 * - Removing comments and unnecessary whitespace
 * - Removing empty groups and redundant transforms
 * - Simplifying paths where possible
 * - Optimizing numbers in attributes
 */
export function optimizeSvg(svgContent: string): string {
    if (!svgContent) return svgContent;

    // Only do basic optimizations for now
    return svgContent
        // Remove XML declaration
        .replace(/<\?xml.*?\?>/, '')
        // Remove comments
        .replace(/<!--[\s\S]*?-->/g, '')
        // Remove empty groups
        .replace(/<g[^>]*>\s*<\/g>/g, '')
        // Remove newlines and extra spaces
        .replace(/\n\s+/g, ' ')
        // Optimize numbers (remove unnecessary decimals)
        .replace(/(\d+)\.0+([^\d])/g, '$1$2')
        // Optimize path data by removing unnecessary spaces
        .replace(/([mzlhvcsqta])\s+/gi, '$1')
        // Combine adjacent transforms where possible
        .replace(/transform="([^"]*)" transform="([^"]*)"/gi, 'transform="$1 $2"');
}