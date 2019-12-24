export interface IApiTest {
  id: string;
  timeout: string;
}

export interface IApiTestsListData {
  apiTestsList: {
    items: IApiTest[];
  };
}
