import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Content, stores, Permission } from '@choerodon/boot';
import { Select } from 'choerodon-ui';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { last, cloneDeep, find } from 'lodash';
import ScrumBoardStore from '@/stores/project/scrumBoard/ScrumBoardStore';
import Column from './Column';
import UnSetColumn from './UnSetColumn';
import './index.less';

const { AppState } = stores;
const { Option } = Select;

@observer
class SettingColumn extends Component {
  handleDragEnd = (result) => {
    if (!result.destination) {
      return;
    }
    // 移动列
    if (result.destination.droppableId === 'columndrop') {
      this.handleMoveColumn(result);
    } else {
      // 移动状态
      this.handleMoveStatus(result);
    }
  }

  handleMoveColumn = (result) => {
    const { source: { index: sourceIndex }, destination: { index: destinationIndex }, draggableId } = result;
    if (sourceIndex === destinationIndex) {
      return;
    }
    const { refresh } = this.props;
    const originBoardData = cloneDeep(ScrumBoardStore.getBoardData);
    const BoardData = ScrumBoardStore.getBoardData;
    const [movedColumn] = BoardData.splice(sourceIndex, 1);
    BoardData.splice(destinationIndex, 0, movedColumn);
    ScrumBoardStore.setBoardData(BoardData);
    const data = {
      boardId: ScrumBoardStore.getSelectedBoard,
      columnId: JSON.parse(draggableId).columnId,
      projectId: parseInt(AppState.currentMenuType.id, 10),
      sequence: destinationIndex,
      objectVersionNumber: JSON.parse(draggableId).objectVersionNumber,
    };
    ScrumBoardStore.axiosUpdateColumnSequence(
      ScrumBoardStore.getSelectedBoard, data,
    ).then((res) => {
      refresh();
    }).catch((error) => {
      ScrumBoardStore.setBoardData(originBoardData);
    });
  }

  handleMoveStatus = (result) => {
    const { refresh } = this.props;
    const {
      source: {
        index: sourceIndex, 
        droppableId: sourceDroppableId, 
      }, 
      destination: {
        index: destinationIndex, 
        droppableId: destinationDroppableId, 
      }, draggableId, 
    } = result;
    const sourceType = sourceDroppableId.split(',')[0];
    const sourceColumnId = Number(sourceDroppableId.split(',')[1]);
    const destinationType = destinationDroppableId.split(',')[0];
    const destinationColumnId = Number(destinationDroppableId.split(',')[1]);
    const [statusCode, statusObjectVersionNumber] = draggableId.split(',');
    if (sourceColumnId === destinationColumnId && sourceIndex === destinationIndex) {
      return;
    }
    // 保留原数据
    const originBoardData = cloneDeep(ScrumBoardStore.getBoardData);
    const newState = ScrumBoardStore.getBoardData;
    const sourceStatusList = find(newState, { columnId: sourceColumnId }).subStatusDTOS;
    const destinationStatusList = find(newState, { columnId: destinationColumnId }).subStatusDTOS;
    // 移动状态
    const [movedStatus] = sourceStatusList.splice(sourceIndex, 1);
    destinationStatusList.splice(destinationIndex, 0, movedStatus);
    const request = destinationType === 'unset' ? ScrumBoardStore.moveStatusToUnset : ScrumBoardStore.moveStatusToColumn;
    ScrumBoardStore.setBoardData(newState);

    request(statusCode, {
      columnId: destinationType === 'unset' ? sourceColumnId : destinationColumnId,
      position: destinationIndex,
      statusObjectVersionNumber,
      originColumnId: sourceColumnId,
    }).then((data) => {
      const newData = data;
      newData.issues = movedStatus.issues;
      destinationStatusList.splice(destinationIndex, 1, newData);     
      ScrumBoardStore.setBoardData(newState);
      refresh();
    }).catch((error) => {
      ScrumBoardStore.setBoardData(originBoardData);
    });
  }

  renderColumns(data, isDragDisabled) {
    const { refresh } = this.props;
    return data.map((column, index) => (
      <Column
        isDragDisabled={isDragDisabled}
        data={column}
        refresh={refresh.bind(this)}
        index={index}
        styleValue={`${parseFloat(parseFloat(1 / data.length) * 100)}%`}
      />
    ));
  }

  render() {
    const BoardData = ScrumBoardStore.getBoardData;
    const columns = BoardData.slice(0, -1);
    const unsetColumn = last(BoardData);
    const menu = AppState.currentMenuType;
    const { type, id: projectId, organizationId: orgId } = menu;
    return (
      <Content
        style={{
          padding: 0,
          overflow: 'unset',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Permission
            service={['agile-service.board.updateScrumBoard']}
            noAccessChildren={(
              <Select
                value={ScrumBoardStore.getCurrentConstraint}
                label="列约束"
                style={{ width: 512 }}
                disabled
              >
                {
                  ScrumBoardStore.getLookupValue.constraint ? (
                    ScrumBoardStore.getLookupValue.constraint.map(item => (
                      <Option key={item.valueCode} value={item.valueCode}>{item.name}</Option>
                    ))
                  ) : ''
                }
              </Select>
            )}
          >
            <Select
              value={ScrumBoardStore.getCurrentConstraint}
              label="列约束"
              style={{ width: 512 }}
              onChange={(value) => {
                const oldData = ScrumBoardStore.getBoardList.get(ScrumBoardStore.getSelectedBoard);
                ScrumBoardStore.axiosUpdateBoard({
                  boardId: ScrumBoardStore.getSelectedBoard,
                  columnConstraint: value,
                  projectId: AppState.currentMenuType.id,
                  objectVersionNumber: oldData.objectVersionNumber,
                }).then((res) => {
                  ScrumBoardStore.setBoardList(ScrumBoardStore.getSelectedBoard, res);
                  ScrumBoardStore.setCurrentConstraint(value);
                }).catch((error) => {
                });
              }}
            >
              {
                ScrumBoardStore.getLookupValue.constraint ? (
                  ScrumBoardStore.getLookupValue.constraint.map(item => (
                    <Option key={item.valueCode} value={item.valueCode}>{item.name}</Option>
                  ))
                ) : ''
              }
            </Select>
          </Permission>
        </div>
        <div className="c7n-scrumsetting">
          <DragDropContext
            onDragEnd={this.handleDragEnd}
          >
            <Droppable droppableId="columndrop" direction="horizontal" type="columndrop">
              {provided => (
                <div
                  ref={provided.innerRef}
                  style={{
                    display: 'flex',
                    flex: BoardData.length,
                  }}
                  {...provided.droppableProps}
                >
                  <Permission
                    service={['agile-service.board-column.columnSortByProgram']}
                    noAccessChildren={this.renderColumns(columns, true)}
                  >
                    {this.renderColumns(columns)}
                  </Permission>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            {unsetColumn && (
              <UnSetColumn
                data={unsetColumn}
              />
            )}
          </DragDropContext>
        </div>
      </Content>
    );
  }
}

export default SettingColumn;
