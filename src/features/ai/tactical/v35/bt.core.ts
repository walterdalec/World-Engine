export type TickStatus = 'Success' | 'Failure' | 'Running';

export interface BTNodeContext {
  time: number;
  seed: number;
  state: any;
  brain: any;
  blackboard: any;
}

export interface BTNode {
  tick(ctx: BTNodeContext): TickStatus;
}

export class Sequence implements BTNode {
  private index = 0;
  constructor(private children: BTNode[]) {}

  tick(ctx: BTNodeContext): TickStatus {
    while (this.index < this.children.length) {
      const status = this.children[this.index].tick(ctx);
      if (status === 'Running' || status === 'Failure') return status;
      this.index += 1;
    }
    this.index = 0;
    return 'Success';
  }
}

export class Selector implements BTNode {
  constructor(private children: BTNode[]) {}

  tick(ctx: BTNodeContext): TickStatus {
    for (const child of this.children) {
      const status = child.tick(ctx);
      if (status !== 'Failure') return status;
    }
    return 'Failure';
  }
}

export class DecorCooldown implements BTNode {
  private last = -Infinity;
  constructor(private node: BTNode, private cooldownTurns: number) {}

  tick(ctx: BTNodeContext): TickStatus {
    if (ctx.time < this.last + this.cooldownTurns) return 'Failure';
    const status = this.node.tick(ctx);
    if (status === 'Success') this.last = ctx.time;
    return status;
  }
}

export class Leaf implements BTNode {
  constructor(private fn: (ctx: BTNodeContext) => TickStatus) {}
  tick(ctx: BTNodeContext): TickStatus {
    return this.fn(ctx);
  }
}
