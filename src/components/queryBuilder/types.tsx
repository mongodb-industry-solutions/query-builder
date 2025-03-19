export interface Template {
    id: string;
    name: string;
    description: string;
    archetype_node_id: string;
    creator: string;
    tree: TreeNode;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface TreeNode {
    name: string;
    nodeId: string;
    rmType: string;
    aqlPath: string;
    localizedName?: string;
    localizedDescriptions?: {
      [key: string]: string;
    };
    min?: number;
    max?: number;
    cardinality?: string;
    children?: TreeNode[];
  }
  
  export interface QueryPart {
    template: string;
    node: TreeNode;
    alias?: string;
  }
  
  export interface ContainsNode extends QueryPart {
    parentIndex?: number; 
    isRoot?: boolean;     
  }
  
  export interface WhereCondition extends QueryPart {
    operator: string;
    value: string;
  }
  
  export interface OrderByItem extends QueryPart {
    direction: 'ASC' | 'DESC';
  }
  
  export interface QueryState {
    select: QueryPart[];
    from: string[];
    contains: QueryPart[];
    where: WhereCondition[];
    orderBy: OrderByItem[];
    limit: string;
    offset: string;
  }
  
  export interface ExpandedSections {
    select: boolean;
    where: boolean;
    orderBy: boolean;
    returnOptions: boolean;
  }