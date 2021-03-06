import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'choerodon-ui';
import { Select } from 'choerodon-ui';
import IsInProgramStore from '@/stores/common/program/IsInProgramStore';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { featureApi } from '@/api';
import BacklogStore from '../../../../stores/project/backlog/BacklogStore';
import { QuickSearchEvent } from '../../../../components/QuickSearch';
import FeatureItem from './FeatureItem';
import { getPiNotDone } from '../../../../api/FeatureApi';
import './Feature.less';

const { Option } = Select;
@observer
class Feature extends Component {
  constructor(props) {
    super(props);
    this.state = {
      notDonePiList: [],
    };
  }

  componentDidMount() {
    this.featureRefresh(undefined, true);
  }

  featureRefresh = (piId, isFirstLoad = false) => {
    Promise.all([featureApi.getByPiIdInSubProject(piId), featureApi.getColors(), getPiNotDone(['todo', 'doing'])]).then(([featureData, featureColor, notDonePiList]) => {
      BacklogStore.setFeatureData(featureData);
      BacklogStore.setColorLookupValue(featureColor.lookupValues);
      BacklogStore.setRandomFeatureColor(featureData, featureColor.lookupValues);
      this.setState({
        notDonePiList,
      });
      if (isFirstLoad) {
        BacklogStore.setSelectedPiId(notDonePiList.find(pi => pi.statusCode === 'doing') && notDonePiList.find(pi => pi.statusCode === 'doing').id);
      }
    }).catch((error3) => { });
  };

  /**
   *点击featureItem的事件
   *
   * @param {*} type
   * @memberof 
   */
  handleClickFeature = (type) => {
    BacklogStore.setChosenFeature(type);
    BacklogStore.axiosGetSprint().then((res) => {
      BacklogStore.setSprintData(res);
    }).catch(() => {
    });
  };

  handlePiChange = (piId) => {
    BacklogStore.setSelectedPiId(piId);
    this.featureRefresh(piId);
  }

  render() {
    const { refresh, issueRefresh } = this.props;
    const { notDonePiList } = this.state;
    const { selectedPiId } = BacklogStore;
    return BacklogStore.getCurrentVisible === 'feature' ? (
      <div className="c7n-backlog-epic">
        <div className="c7n-backlog-epicContent">
          <div className="c7n-backlog-epicTitle">
            <p style={{ fontWeight: 'bold' }}>特性</p>
            <div className="c7n-backlog-epicRight">
              <Icon
                type="first_page"
                role="none"
                onClick={() => {
                  BacklogStore.toggleVisible(null);
                  QuickSearchEvent.emit('unSelectStory');
                }}
                style={{
                  cursor: 'pointer',
                  marginLeft: 6,
                }}
              />
            </div>
          </div>
          <div className="c7n-backlog-epicChoice">
            <div
              className="c7n-backlog-epicItems-first primary"
              style={{
                background: BacklogStore.getChosenFeature === 'all' ? 'rgba(140, 158, 255, 0.08)' : '',
              }}
              role="none"
              onClick={() => {
                this.handleClickFeature('all');
              }}
            >
              所有问题
            </div>
            <Select
              onChange={this.handlePiChange}
              value={selectedPiId}
              placeholder="PI"
              className="c7n-backlog-piSelect"
              allowClear
            >
              {
                notDonePiList.map(pi => (
                  <Option key={pi.id} value={pi.id}>
                    {`${pi.code}-${pi.name}`}
                    {pi.id === (IsInProgramStore.piInfo && IsInProgramStore.piInfo.id) && (
                    <div
                      style={{
                        marginLeft: '0.08rem',
                      }}
                      className="c7n-agile-sprintSearchSelect-option-active"
                    >
                      当前
                    </div>
                    )}
                  </Option>
                ))
              }
            </Select>
            {!notDonePiList.find(pi => pi.statusCode === 'doing') && !selectedPiId && (
              <p style={{
                paddingLeft: '10px',
                paddingTop: '2px',
                color: 'rgba(0, 0, 0, 0.5)',
                fontSize: '12px',
              }}
              >
                当前没有已开启的PI
              </p>
            )}
            <DragDropContext
              onDragEnd={(result) => {
                const { destination, source } = result;
                if (!destination || !source) {
                  return;
                }
                const { index: destinationIndex } = destination;
                const { index: sourceIndex } = source;
                BacklogStore.moveFeature(sourceIndex, destinationIndex);
              }}
            >
              <Droppable droppableId="feature">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    style={{
                      background: snapshot.isDraggingOver ? '#e9e9e9' : 'white',
                      padding: 'grid',
                    }}
                  >
                    <FeatureItem
                      clickFeature={this.handleClickFeature}
                      refresh={refresh}
                      issueRefresh={issueRefresh}
                    />
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <div
              className="c7n-backlog-epicItems-last"
              style={{
                background: BacklogStore.getChosenFeature === 'unset' ? 'rgba(140, 158, 255, 0.08)' : '',
              }}
              role="none"
              onClick={() => {
                this.handleClickFeature('unset');
              }}
              onMouseEnter={(e) => {
                if (BacklogStore.isDragging) {
                  BacklogStore.toggleIssueDrag(true);
                  e.currentTarget.style.border = '2px dashed green';
                }
              }}
              onMouseLeave={(e) => {
                if (BacklogStore.isDragging) {
                  BacklogStore.toggleIssueDrag(false);
                  e.currentTarget.style.border = 'none';
                }
              }}
              onMouseUp={(e) => {
                if (BacklogStore.getIsDragging) {
                  BacklogStore.toggleIssueDrag(false);
                  e.currentTarget.style.border = 'none';
                  BacklogStore.axiosUpdateIssuesToFeature(
                    0, BacklogStore.getIssueWithEpicOrVersion,
                  ).then(() => {
                    issueRefresh();
                    refresh();
                  }).catch(() => {
                    issueRefresh();
                    refresh();
                  });
                }
              }}
            >
              未指定特性的问题
            </div>
          </div>
        </div>
      </div>
    ) : null;
  }
}

export default Feature;
