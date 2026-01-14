import { Alova } from '@/utils/http/alova/index';

//获取table
export function getTableList(params) {
  return Alova.Get('/table/list', { params });
}

// 导入表格数据
export function importTableData(data) {
  return Alova.Post('/table/import', data);
}
