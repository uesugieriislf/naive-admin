import { h } from 'vue';
import { NAvatar, NTag } from 'naive-ui';
import { BasicColumn } from '@/components/Table';

// 定义Excel数据接口
export interface ListData {
  series?: string;
  id?: number;
  image?: string;
  jinriCode?: string;
  modelName?: string;
  year?: string | number;
  remarks?: string;
  avatar?: string;
}

export const columns: BasicColumn<ListData>[] = [
  {
    title: '车系',
    key: 'series',
  },
  {
    title: '序号',
    key: 'id',
  },
  {
    title: '图片',
    key: 'avatar',
    render(record) {
      return h(NAvatar, {
        size: 50,
        src: record.avatar,
      });
    },
  },
  {
    title: '金日编码',
    key: 'jinriCode',
  },
  {
    title: '车型名称',
    key: 'modelName',
    width: 180,
  },
  {
    title: '适配年份',
    key: 'year',
  },
  {
    title: '车型问题备注',
    key: 'remarks',
    width: 200,
  },
];
