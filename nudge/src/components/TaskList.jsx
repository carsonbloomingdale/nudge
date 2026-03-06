import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import fetchTasks from "../api/fetchTasks";

const TaskListDiv = styled.div`
  position: absolute;
  left: 0px;
  top: 0px;
  margin: 20px;
  font-size: 17px;
  display: flex;
  flex-wrap: wrap;
  opacity: 0.7;
  width: 95vw;
  max-height: 95vh;
  overflow: hidden;
  opacity: 0.5;
`;

const TaskDiv = styled.div`
  background-color: white;
  max-width: 300px;
  margin-bottom: 20px;
  margin-left: 20px;
  margin-right: 20px;
  border-radius: 5px;
  color: #133926;
  padding: 10px;
`;

const TaskList = ({ taskList }) => {
  return (
    <TaskListDiv>
      {taskList &&
        taskList.map((item, index) => (
          <TaskDiv key={index}>{item.label}</TaskDiv>
        ))}
    </TaskListDiv>
  );
};

export default TaskList;
