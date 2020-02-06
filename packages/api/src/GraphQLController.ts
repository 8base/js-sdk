import {
  DocumentNode,
  Kind,
  OperationDefinitionNode,
  OperationTypeNode,
  parse,
} from 'graphql/language';

const GRAPHQL_FULL_QUERY_PATTERN = /^\s*query/im;

export class GraphQLController {
  public static getQueryDocument(query: string): DocumentNode {
    return parse(query);
  }

  public static getOperationDefinition(
    root: DocumentNode,
  ): OperationDefinitionNode {
    return root.definitions.find(
      definition => definition.kind === Kind.OPERATION_DEFINITION,
    ) as OperationDefinitionNode;
  }

  public static isOperation(
    operationType: OperationTypeNode,
    operationDefinition: OperationDefinitionNode,
  ): boolean {
    return operationDefinition.operation === operationType;
  }

  public static doesStartWithQuery(query: string): boolean {
    return GRAPHQL_FULL_QUERY_PATTERN.test(query);
  }
}
