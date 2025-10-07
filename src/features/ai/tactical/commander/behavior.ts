
export type BTResult = 'success' | 'failure' | 'running';

export interface NodeCtx {
  bb: any;
  now: number;
}

export interface BTNode {
  tick(ctx: NodeCtx): BTResult;
}

export class Sequence implements BTNode {
  constructor(private readonly nodes: BTNode[]) {}

  tick(ctx: NodeCtx): BTResult {
    for (const node of this.nodes) {
      const result = node.tick(ctx);
      if (result !== 'success') return result;
    }
    return 'success';
  }
}

export class Selector implements BTNode {
  constructor(private readonly nodes: BTNode[]) {}

  tick(ctx: NodeCtx): BTResult {
    for (const node of this.nodes) {
      const result = node.tick(ctx);
      if (result !== 'failure') return result;
    }
    return 'failure';
  }
}

export class Condition implements BTNode {
  constructor(private readonly predicate: (ctx: NodeCtx) => boolean) {}

  tick(ctx: NodeCtx): BTResult {
    return this.predicate(ctx) ? 'success' : 'failure';
  }
}

export class Action implements BTNode {
  constructor(private readonly fn: (ctx: NodeCtx) => BTResult) {}

  tick(ctx: NodeCtx): BTResult {
    return this.fn(ctx);
  }
}
