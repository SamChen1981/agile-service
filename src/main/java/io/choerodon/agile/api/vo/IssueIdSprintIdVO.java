package io.choerodon.agile.api.vo;

/**
 * @author shinan.chen
 * @since 2019/5/27
 */
public class IssueIdSprintIdVO {

    private Long issueId;
    private String typeCode;
    private Long sprintId;

    public Long getIssueId() {
        return issueId;
    }

    public void setIssueId(Long issueId) {
        this.issueId = issueId;
    }

    public Long getSprintId() {
        return sprintId;
    }

    public void setSprintId(Long sprintId) {
        this.sprintId = sprintId;
    }

    public String getTypeCode() {
        return typeCode;
    }

    public void setTypeCode(String typeCode) {
        this.typeCode = typeCode;
    }
}

