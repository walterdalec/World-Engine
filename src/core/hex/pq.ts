/**
 * Binary Heap Priority Queue
 * Optimized for A* and Dijkstra pathfinding algorithms
 */

export class MinHeap<T> {
    private data: { k: number; v: T }[] = [];

    size(): number {
        return this.data.length;
    }

    push(k: number, v: T): void {
        const a = this.data;
        a.push({ k, v });
        this.up(a.length - 1);
    }

    pop(): T | undefined {
        const a = this.data;
        if (!a.length) return;

        const top = a[0]!.v;
        const last = a.pop()!;

        if (a.length) {
            a[0] = last;
            this.down(0);
        }

        return top;
    }

    private up(i: number): void {
        const a = this.data;
        while (i) {
            const p = (i - 1) >> 1;
            if (a[p]!.k <= a[i]!.k) break;
            [a[p]!, a[i]!] = [a[i]!, a[p]!];
            i = p;
        }
    }

    private down(i: number): void {
        const a = this.data;
        for (; ;) {
            const l = i * 2 + 1;
            const r = l + 1;
            let m = i;

            if (l < a.length && a[l]!.k < a[m]!.k) m = l;
            if (r < a.length && a[r]!.k < a[m]!.k) m = r;
            if (m === i) break;

            [a[m]!, a[i]!] = [a[i]!, a[m]!];
            i = m;
        }
    }
}