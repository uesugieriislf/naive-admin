<template>
  <basicModal @register="modalRegister" ref="modalRef" @on-ok="okModal">
    <div class="pt-8">
      <BasicForm @register="registerForm" />
    </div>
  </basicModal>
</template>

<script lang="ts" setup>
  import { nextTick, ref } from 'vue';
  import { FormSchema, useForm } from '@/components/Form';
  import { basicModal, useModal } from '@/components/Modal';
  import { updateRole } from '@/api/system/role';
  import { useMessage } from 'naive-ui';

  const message = useMessage();
  const currentRoleId = ref<number>();
  const emit = defineEmits(['success']);

  const schemas: FormSchema[] = [
    {
      field: 'name',
      component: 'NInput',
      label: '角色名称',
      componentProps: {
        placeholder: '请输入角色名称',
      },
      rules: [{ required: true, message: '请输入角色名称', trigger: ['blur'] }],
    },
    {
      field: 'explain',
      component: 'NInput',
      label: '角色说明',
      componentProps: {
        type: 'textarea',
        placeholder: '请输入角色角色说明',
      },
    },
    {
      field: 'isDefault',
      component: 'NSwitch',
      label: '默认角色',
      componentProps: {},
    },
  ];

  const [registerForm, { submit, setFieldsValue, resetFields }] = useForm({
    gridProps: { cols: 1 },
    collapsedRows: 3,
    labelWidth: 80,
    layout: 'horizontal',
    submitButtonText: '保存',
    showActionButtonGroup: false,
    schemas,
  });

  const [modalRegister, { openModal, closeModal, setSubLoading }] = useModal({
    title: '编辑角色',
    subBtuText: '保存',
  });

  function showModal(record: any) {
    currentRoleId.value = record.id;
    openModal();
    nextTick(() => {
      record && setFieldsValue({ ...record });
    });
  }

  async function okModal() {
    const formRes = await submit();
    if (formRes) {
      try {
        await updateRole(currentRoleId.value!, formRes);
        message.success('更新成功');
        closeModal();
        resetFields();
        emit('success');
      } catch (error: any) {
        const errorMsg = error?.response?.data?.message || error?.message || '更新失败';
        message.error(errorMsg);
      } finally {
        setSubLoading(false);
      }
    } else {
      setSubLoading(false);
    }
  }

  defineExpose({
    showModal,
  });
</script>
