import React, {
  Fragment, useContext,
} from 'react';
import { observer } from 'mobx-react-lite';
import {
  Table, Button, CheckBox, Modal, Menu, Icon,
} from 'choerodon-ui/pro';
import { Tag } from 'choerodon-ui';
import {
  TabPage as Page, Header, Content, Breadcrumb, Choerodon,
} from '@choerodon/boot';

import Store from './stores';
import TableDropMenu from '../../../common/TableDropMenu';
import TypeTag from '../../../components/TypeTag';
import CreateField from './components/create-field';

import './ObjectScheme.less';

const { Column } = Table;

const showIcons = {
  史诗: {
    icon: 'agile_epic',
    colour: '#743be7',
    typeCode: 'issue_epic',
    name: '史诗',
  },
  故事: {
    icon: 'agile_story',
    colour: '#00bfa5',
    typeCode: 'story',
    name: '故事',
  },
  特性: {
    icon: 'agile-feature',
    colour: '#3D5AFE',
    typeCode: 'feature',
    name: '特性',
  },
  缺陷: {
    icon: 'agile_fault',
    colour: '#f44336',
    typeCode: 'bug',
    name: '缺陷',
  },
  任务: {
    icon: 'agile_task',
    colour: '#4d90fe',
    typeCode: 'task',
    name: '任务',
  },
  子任务: {
    icon: 'agile_subtask',
    colour: '#4d90fe',
    typeCode: 'sub_task',
    name: '子任务',
  },
};

const createModelKey = Modal.key();
const editModelKey = Modal.key();

const createModelStyle = {
  width: 740,
};

function ObjectScheme() {
  const context = useContext(Store);
  const {
    AppState, prefixCls, schemeTableDataSet,
    intl: { formatMessage },
    schemeCode,
    store,
  } = context;


  function handleRefresh() {
    schemeTableDataSet.query();
  }

  function handleRemove() {
    const record = schemeTableDataSet.current;
    const modalProps = {
      title: formatMessage({ id: 'field.delete.title' }, { name: record.get('name') }),
      children: formatMessage({ id: 'field.delete.msg' }),
      okText: formatMessage({ id: 'delete' }),
      okProps: { color: 'red' },
      cancelProps: { color: 'dark' },
    };
    schemeTableDataSet.delete(record, modalProps);
  }

  function handleCheckChange() {
    const record = schemeTableDataSet.current;
    const defaultValue = schemeTableDataSet.get('defaultValue');
    const required = record.get('required');
    if (record.get('system')) {
      return;
    }
    if (!required && defaultValue) {
      Choerodon.prompt(formatMessage({ id: 'field.required.msg' }));
    }
    const field = {
      required: !required,
      objectVersionNumber: record.get('objectVersionNumber'),
    };
    store.updateField(record.get('id'), field).then(() => {
      handleRefresh();
    });
  }


  // 打开创建模态框
  function openCreateFieldModal() {
    const values = {
      formatMessage,
      schemeCode,
      handleRefresh,
    };
    Modal.open({
      key: createModelKey,
      title: formatMessage({ id: 'field.create' }),
      drawer: true,
      children: <CreateField {...values} />,
      style: createModelStyle,
      okText: formatMessage({ id: 'save' }),
      cancelText: formatMessage({ id: 'cancel' }),
    });
  }

  // 打开编辑模态框
  function openEditFieldModal() {
    const record = schemeTableDataSet.current;
    const values = {
      formatMessage,
      schemeCode,
      handleRefresh,
      record,
    };
    Modal.open({
      key: editModelKey,
      title: formatMessage({ id: 'field.edit' }),
      drawer: true,
      children: <CreateField {...values} />,
      style: createModelStyle,
      okText: formatMessage({ id: 'save' }),
      cancelText: formatMessage({ id: 'cancel' }),
    });
  }

  const renderDropDown = ({ text, record }) => {
    const system = record.get('system');
    const projectId = record.get('projectId');
    if (system) {
      return text;
    }
    const menu = (
      <Menu onClick={handleRemove}>
        <Menu.Item key="del">
          <span>{formatMessage({ id: 'delete' })}</span>
        </Menu.Item>
      </Menu>

    );
    return (
      <div className="c7n-table-cell-drop-menu">
        <TableDropMenu
          menu={menu}
          onClickEdit={openEditFieldModal}
          text={text}
          isHasMenu={!(system || (AppState.currentMenuType.type === 'project' && !projectId))}
        />
      </div>
    );
  };

  const renderContextName = ({ text }) => (
    <Fragment>
      {text.split(',').map(name => (
        showIcons[name] ? <TypeTag style={{ marginRight: 4 }} data={showIcons[name]} showName /> : name
      ))}
    </Fragment>
  );

  const renderFieldOrigin = ({ record }) => {
    const system = record.get('system');
    const projectId = record.get('projectId');
    if (system) {
      return <Tag style={{ color: 'rgba(0,0,0,0.65)', borderColor: '#d9d9d9', background: '#fafafa' }}>{formatMessage({ id: 'system' })}</Tag>;
    } else {
      return projectId
        ? (
          <Tag 
            style={{
              background: '#fafafa',
              color: '#5CC2F2',
              borderColor: '#5CC2F2',
            }}
          >
            <span>{formatMessage({ id: 'project' })}</span>
          </Tag>
        )
        : (
          <Tag 
            style={{
              background: '#fafafa',
              color: '#3f51b5',
              borderColor: '#3f51b5',
            }}
          >
            <span>{formatMessage({ id: 'organization' })}</span>
          </Tag>
        );
    }
  };

  const renderRequired = ({ record }) => {
    const system = record.get('system');
    const required = record.get('required');
    const projectId = record.get('projectId');

    return (
      <div>
        <CheckBox
          defaultChecked={required}
          disabled={system || (AppState.currentMenuType.type === 'project' && !projectId)}
          onChange={handleCheckChange}
        />
      </div>
    );
  };


  const service = AppState.currentMenuType.type === 'project' ? [
    'agile-service.project-object-scheme-field.listQuery',
    'agile-service.project-object-scheme-field.create',
    'agile-service.project-object-scheme-field.checkCode',
    'agile-service.project-object-scheme-field.checkName',
    'agile-service.project-object-scheme-field.listQuery',
    'agile-service.project-object-scheme-field.queryById',
    'agile-service.project-object-scheme-field.update',
    'agile-service.project-object-scheme-field.delete',
  ]
    : ['agile-service.object-scheme-field.listQuery',
      'agile-service.object-scheme-field.create',
      'agile-service.object-scheme-field.checkCode',
      'agile-service.object-scheme-field.checkName',
      'agile-service.object-scheme-field.listQuery',
      'agile-service.object-scheme-field.queryById',
      'agile-service.object-scheme-field.update',
      'agile-service.object-scheme-field.delete',
    ];

  return (
    <Page
      service={service}
    >
      <Header>
        <Button
          funcType="flat"
          onClick={openCreateFieldModal}
        >
          <Icon type="playlist_add icon" />
          <span>{formatMessage({ id: 'field.create' })}</span>
        </Button>
      </Header>
      <Breadcrumb />
      <Content className={`${prefixCls}-detail-content`}>
        <Table dataSet={schemeTableDataSet} queryBar="none" className={`${prefixCls}-detail-content-table`}>
          <Column name="name" renderer={renderDropDown} />
          <Column name="contextName" renderer={renderContextName} width={330} />
          <Column name="fieldOrigin" renderer={renderFieldOrigin} header={formatMessage({ id: 'field.origin' })} />
          <Column name="fieldTypeName" />
          <Column name="required" renderer={renderRequired} />
        </Table>
      </Content>
    </Page>
  );
}


export default observer(ObjectScheme);
