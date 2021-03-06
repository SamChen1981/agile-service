import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Select, Tooltip } from 'choerodon-ui';
import { map, isEqual } from 'lodash';
import { featureApi } from '@/api';
import { getTeamSprints } from '@/api/PIApi';
import TextEditToggle from '../../../../TextEditToggle';

const { Option, OptGroup } = Select;
const { Text, Edit } = TextEditToggle;


@observer class FieldProgramSprint extends Component {
  constructor(props) {
    super(props);
    this.state = {
      originSprints: [],
      selectLoading: false,
    };
  }

  componentDidMount() {
    this.loadIssueSprints();
  }

  static getDerivedStateFromProps(props, state) {
    if (isEqual(state.teamIds, props.teamIds)) {
      return ({
        teamIds: props.teamIds,
      });
    }
    return null;
  }

  loadIssueSprints = () => {
    const { store } = this.props;
    const issue = store.getIssue;
    const activePiTeams = issue.activePiTeams || [];
    const { id } = issue.activePi || {};
    const teamIds = activePiTeams.map(team => team.id);
    if (!id || teamIds.length === 0) {
      return;
    }
    getTeamSprints(id, teamIds).then((res) => {
      this.setState({
        originSprints: res,
        selectLoading: false,
      });
    });
  };

  updateIssueSprint = async (sprintIds, done) => {
    const {
      store, onUpdate, reloadIssue,
    } = this.props;
    const issue = store.getIssue;
    const { issueId } = issue;
    const activePiSprints = issue.activePiSprints || [];
    const originSprintIds = activePiSprints.map(sprint => sprint.sprintId);
    const addSprints = sprintIds.filter(teamId => !originSprintIds.includes(teamId));
    const removeSprints = originSprintIds.filter(sprintId => !sprintIds.includes(sprintId));
    await featureApi.updateTeamAndSprint({
      piId: issue.activePi ? issue.activePi.id : null,
      deleteSprintIds: removeSprints,
      featureId: issue.issueId,
      sprintIds: addSprints,
      teamProjectIds: [],
      deleteTeamProjectIds: [],
    });
    
    if (onUpdate) {
      onUpdate();
    }
    await reloadIssue(issueId);
    done();
  };

  render() {
    const { selectLoading, originSprints } = this.state;
    const { store, disabled } = this.props;
    const issue = store.getIssue;
    const activePiSprints = issue.activePiSprints || [];
    const closedPiSprints = issue.closedPiSprints || [];
    const sprintIds = activePiSprints.map(s => s.sprintId);
    return (
      <div className="line-start mt-10">
        <div className="c7n-property-wrapper">
          <span className="c7n-property">
            冲刺
          </span>
        </div>
        <div className="c7n-value-wrapper">
          <TextEditToggle
            disabled={disabled}
            formKey="sprint"
            onSubmit={this.updateIssueSprint}
            originData={sprintIds}
            editExtraContent={
              closedPiSprints.length ? (
                <div style={{ maxWidth: 170 }}>
                  <span>已结束冲刺</span>
                  <span>
                    {map(closedPiSprints, 'sprintName').join(' , ')}
                  </span>
                </div>
              ) : null
            }
          >
            <Text>
              <Tooltip
                placement="top"
                title={`该特性经历迭代数${closedPiSprints.length + activePiSprints.length}`}
              >
                <div>
                  {
                    closedPiSprints.concat(activePiSprints).length === 0 ? '无' : (
                      <div>
                        <div>
                          {map(closedPiSprints, 'sprintName').join(' , ')}
                        </div>
                        <div>
                          {activePiSprints.map(sprint => (
                            <div
                              style={{
                                color: '#4d90fe',
                                fontSize: '13px',
                                lineHeight: '20px',
                                marginTop: closedPiSprints.length ? 5 : 0,
                              }}
                            >
                              {sprint.sprintName}
                            </div>
                          ))}                        
                        </div>
                      </div>
                    )
                  }
                </div>
              </Tooltip>
            </Text>
            <Edit>
              <Select
                label="活跃冲刺"
                mode="multiple"
                getPopupContainer={() => document.getElementById('detail')}
                allowClear
                loading={selectLoading}
                showCheckAll={false}
              >
                {originSprints.map(team => (
                  <OptGroup label={team.projectVO.name} key={team.projectVO.id}>
                    {(team.sprints || []).map(sprint => (
                      <Option key={`${sprint.sprintId}`} value={sprint.sprintId}>
                        <Tooltip placement="topRight" title={sprint.sprintName}>{sprint.sprintName}</Tooltip>
                      </Option>
                    ))}
                  </OptGroup>
                ))}
              </Select>
            </Edit>
          </TextEditToggle>
        </div>
      </div>
    );
  }
}

export default FieldProgramSprint;
