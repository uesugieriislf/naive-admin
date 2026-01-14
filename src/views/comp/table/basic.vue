<template>
  <n-card :bordered="false" class="proCard">
    <BasicTable
      title="表格列表"
      titleTooltip="这是一个提示"
      :columns="columns"
      :request="loadDataTable"
      :row-key="(row) => row.id"
      ref="actionRef"
      :actionColumn="actionColumn"
      :scroll-x="1360"
      @update:checked-row-keys="onCheckedRow"
    >
      <template #toolbar>
        <n-button type="primary" @click="handleImport" icon-placement="left" style="margin-right: 8px;">
          <template #icon>
            <n-icon><UploadOutlined /></n-icon>
          </template>
          导入Excel
        </n-button>
      </template>
    </BasicTable>
  </n-card>
</template>

<script lang="ts" setup>
  import { reactive, ref, h } from 'vue';
  import { BasicTable, TableAction } from '@/components/Table';
  import { getTableList, importTableData } from '@/api/table/list';
  import { columns } from './basicColumns';
  import { useDialog, useMessage, useNotification } from 'naive-ui';
  import { DeleteOutlined, EditOutlined, UploadOutlined } from '@vicons/antd';
  import * as XLSX from 'xlsx';

  const message = useMessage();
  const dialog = useDialog();
  const notification = useNotification();
  const actionRef = ref();

  const params = reactive({
    pageSize: 5,
    name: 'NaiveAdmin',
  });

  const actionColumn = reactive({
    width: 180,
    title: '操作',
    key: 'action',
    fixed: 'right',
    align: 'center',
    render(record) {
      return h(TableAction as any, {
        style: 'button',
        actions: createActions(record),
      });
    },
  });

  function createActions(record) {
    return [
      {
        label: '删除',
        // 配置 color 会覆盖 type
        icon: DeleteOutlined,
        onClick: handleDelete.bind(null, record),
        // 根据权限控制是否显示: 有权限，会显示，支持多个
        auth: ['basic_list'],
      },
      {
        label: '编辑',
        icon: EditOutlined,
        onClick: handleEdit.bind(null, record),
        auth: ['basic_list'],
      },
    ];
  }

  const loadDataTable = async (res) => {
    return await getTableList({ ...params, ...res });
  };

  function onCheckedRow(rowKeys) {
    console.log(rowKeys);
  }

  function handleDelete(record) {
    console.log(record);
    dialog.info({
      title: '提示',
      content: `您想删除${record.name}`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        message.success('删除成功');
      },
      onNegativeClick: () => {},
    });
  }

  function handleEdit(record) {
    console.log(record);
    message.success('您点击了编辑按钮');
  }

  // 处理Excel导入
  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        // 读取Excel文件
        const { data, images } = await readExcelFile(file);
        // 处理数据
        const processedData = processExcelData(data, images);
        // 调用导入API
        const result = await importTableData(processedData);
        // 显示成功提示
        notification.success({
          title: '导入成功',
          content: `成功导入 ${result.successCount} 条数据，包含 ${images.length} 张图片`,
          duration: 3000,
        });
        // 刷新表格
        actionRef.value?.reload();
      } catch (error) {
        notification.error({
          title: '导入失败',
          content: error.message || '导入过程中出现错误',
          duration: 3000,
        });
      }
    };
    input.click();
  }

  // 读取Excel文件
  function readExcelFile(file: File): Promise<{ data: any[], images: any[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          // 使用arraybuffer类型读取，更好地保留二进制数据
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          console.log('Excel数据读取成功，行数:', jsonData.length);
          
          // 提取图片
          const images = extractImagesFromExcel(workbook);
          console.log('提取到的图片:', images);
          resolve({ data: jsonData, images });
        } catch (error) {
          console.error('Excel文件解析失败:', error);
          reject(new Error('Excel文件解析失败'));
        }
      };
      reader.onerror = () => {
        console.error('文件读取失败');
        reject(new Error('文件读取失败'));
      };
      // 使用arraybuffer类型读取
      reader.readAsArrayBuffer(file);
    });
  }

  // 从Excel中提取图片
  function extractImagesFromExcel(workbook: XLSX.WorkBook): any[] {
    const images: any[] = [];
    
    console.log('Excel文件结构:', {
      hasMedia: !!workbook.Media,
      hasWorkbook: !!workbook.Workbook,
      hasDrawings: workbook.Workbook?.Drawings ? true : false,
      sheetNames: workbook.SheetNames,
      mediaCount: workbook.Media?.length || 0
    });
    
    // 检查工作簿是否包含媒体对象
    if (workbook.Media) {
      console.log('找到Media对象，包含', workbook.Media.length, '个媒体文件');
      workbook.Media.forEach((media: any, index: number) => {
        try {
          console.log('媒体文件', index, ':', {
            Type: media.Type,
            Name: media.Name,
            hasContent: !!media.Content,
            ContentLength: media.Content ? media.Content.length : 0
          });
          
          // 检查媒体类型是否为图片
          if (media.Type && media.Type.includes('image/')) {
            // 尝试获取图片数据
            if (media.Content) {
              // 构建图片数据URL
              const base64Data = media.Content;
              const dataUrl = `data:${media.Type};base64,${base64Data}`;
              images.push({
                id: `image_${index}`,
                type: media.Type,
                content: dataUrl,
                name: media.Name || `image_${index}.${media.Type.split('/')[1]}`
              });
            }
          }
        } catch (error) {
          console.error('提取图片时出错:', error);
        }
      });
    }
    
    // 尝试另一种方式提取图片（适用于某些Excel格式）
    if (images.length === 0 && workbook.Workbook && workbook.Workbook.Drawings) {
      console.log('发现Drawings，但暂时不支持提取');
    }
    
    // 尝试从工作表中提取图片
    if (images.length === 0) {
      console.log('尝试从工作表中提取图片');
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        if (worksheet) {
          console.log(`工作表 ${sheetName} 结构:`, {
            hasImages: worksheet['!images'] ? true : false,
            imageCount: worksheet['!images'] ? worksheet['!images'].length : 0
          });
          
          // 检查工作表是否包含图片
          if (worksheet['!images']) {
            console.log('找到', worksheet['!images'].length, '个图片');
            worksheet['!images'].forEach((image: any, index: number) => {
              console.log('工作表图片', index, ':', image);
              // 这里可以添加从工作表图片提取的逻辑
            });
          }
        }
      });
    }
    
    console.log('最终提取到的图片数量:', images.length);
    return images;
  }

  // 处理Excel数据
  function processExcelData(data: any[], images: any[]): any[] {
    return data.map((item, index) => {
      // 这里根据Excel文件的列名进行映射
      // 假设Excel文件的列名为：id, name, sex, email, city, status, type, createDate
      
      // 尝试为每条数据分配一张图片
      let avatar = `https://picsum.photos/200/200?v=${Date.now() + index}`;
      
      // 检查是否有图片数据
      if (images.length > 0) {
        const imageIndex = index % images.length;
        avatar = images[imageIndex].content;
      } else {
        // 检查数据中是否包含DISPIMG函数
        for (const key in item) {
          if (typeof item[key] === 'string' && item[key].includes('DISPIMG')) {
            // 提取图片ID
            const imgIdMatch = item[key].match(/DISPIMG\("([^"]+)",/);
            if (imgIdMatch && imgIdMatch[1]) {
              // 为DISPIMG图片生成一个占位符URL
              avatar = `https://picsum.photos/200/200?v=${imgIdMatch[1]}`;
              console.log('找到DISPIMG图片:', imgIdMatch[1]);
              break;
            }
          }
        }
      }
      
      return {
        id: item.id || String(Date.now() + index),
        name: item.name || '',
        sex: item.sex || 'male',
        avatar: avatar,
        email: item.email || `user${Date.now() + index}@example.com`,
        city: item.city || '未知城市',
        status: item.status || 'pass',
        type: item.type || 'person',
        createDate: item.createDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
      };
    });
  }
</script>

<style lang="less" scoped></style>
