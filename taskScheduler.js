const assignTasksWithPriorityAndDependencies = (developers, tasks) => {
  const tasksByPriority = prepareTaskQue(tasks);
  const developpersByTaskTypeAndSkillLevel = prepareDevelopperMap(developers);
  const sprintPlanning = {
    developersTasks: [],
    unassignedTasks: [],
  };
  assignToDevs(
    tasksByPriority,
    developpersByTaskTypeAndSkillLevel,
    sprintPlanning,
  );
  return sprintPlanning;
};
const assignToDevs = (
  tasksByPriority,
  developpersByTaskTypeAndSkillLevel,
  sprintPlanning,
) => {
  let unassignedTasks = tasksByPriority;
  while (
    // while there are still tasks that could be assigned loop
    unassignedTasks.length !== 0 &&
    shouldLoop(unassignedTasks, developpersByTaskTypeAndSkillLevel)
  ) {
    for (let i = 0; i < unassignedTasks.length; i++) {
      const devByTaskType =
        developpersByTaskTypeAndSkillLevel[unassignedTasks[i].taskType];
      const dependecies = unassignedTasks.filter(
        t =>
          unassignedTasks[i].dependencies.includes(t.taskName) &&
          (t.assigned === undefined || !t.assigned),
      );
      if (dependecies.length !== 0) {
        const [element] = unassignedTasks.splice(i, 1); // Remove the element
        unassignedTasks.splice(i + 1, 0, element); // Insert it after the following element
        unassignedTasks[i].assigned = false;
        // eslint-disable-next-line no-plusplus
        i++; // Move to the next element to avoid looping over the same one
      } else {
        const devTask = calculateClosestSkillLevel(
          devByTaskType,
          unassignedTasks[i],
          sprintPlanning.developersTasks,
        );
        unassignedTasks[i].assigned = true;
        sprintPlanning.developersTasks[devTask.name] = devTask;
      }
    }
    unassignedTasks = unassignedTasks.filter(task => task.assigned !== true);
  }
  sprintPlanning.unassignedTasks = unassignedTasks;
};
const calculateClosestSkillLevel = (devs, task, devTasks) => {
  const n = findClosest(Object.keys(devs), task.difficulty);
  const devToAssignTo = devs[n][0];
  const dev = devTasks[devToAssignTo.name] || [];
  // assign the task to the adequate dev
  const result = {
    ...devToAssignTo,
    leftHours: devToAssignTo.leftHours - task.hoursRequired,
    numberOfTasksAssigned: devToAssignTo.numberOfTasksAssigned + 1,
    tasks: Array.isArray(dev.tasks)
      ? [
        ...dev.tasks,
        {
          taskName: task.taskName,
        },
      ]
      : [
        {
          taskName: task.taskName,
        },
      ],
  };
  // suffle fevs that has tasks to the back to balance the assigning
  shuffleToBack(devs[n]);
  return result;
};
// find dev with the closest skill level to be able to treat the task
const findClosest = (arr, n) =>
  arr.reduce((closest, current) => {
    const closestDiff = Math.abs(closest - n);
    const currentDiff = Math.abs(current - n);

    if (
      currentDiff < closestDiff ||
      (currentDiff === closestDiff && current > n)
    ) {
      return current;
    }
    return closest;
  });
// sort tasks by priority (smallest priority meaning more prior)
const prepareTaskQue = tasks => tasks.sort((a, b) => a.priority - b.priority);
const prepareDevelopperMap = developers => {
  // extract uniq task types
  const taskTypes = [
    ...new Set(developers.map(developer => developer.preferredTaskType)),
  ];
  const developpersByTaskType = [];
  const developpersByTaskTypeAndSkillLevel = [];
  // create a map of task with list of developers that can work on the task
  taskTypes.forEach(taskType => {
    developpersByTaskType[taskType] = developers.filter(
      developer => developer.preferredTaskType === taskType,
    );
  });
  // for each task type we separate the developers to multiple lists by their skill level
  // (to be used to affect tasks to the dev with closest skill level)
  Object.entries(developpersByTaskType).forEach(([key, valueArray]) => {
    const developpersByLevels = [];
    const levels = [
      ...new Set(valueArray.map(developer => developer.skillLevel)),
    ];
    levels.forEach(level => {
      developpersByLevels[level] = valueArray
        .filter(v => v.skillLevel === level)
        .map(v => ({
          ...v,
          leftHours: v.maxHours,
          numberOfTasksAssigned: 0,
          tasks: [],
        }));
    });
    developpersByTaskTypeAndSkillLevel[key] = developpersByLevels;
  });
  return developpersByTaskTypeAndSkillLevel;
};
const shuffleToBack = list => {
  const firstElement = list.shift(); // Remove the first element
  list.push(firstElement); //  push in to the back of the list
};

const shouldLoop = (tasks, devs) => {
  let r = false;
  // verify if there are possibilities of assigning more tasks
  tasks.forEach(task => {
    const devByTaskType = devs[task.taskType];
    const lefstHoursLists = devByTaskType.flatMap(arr =>
      arr.map(item => item.leftHours),
    );
    if (lefstHoursLists.some(hours => hours > task.hoursRequired)) {
      r = true;
    }
  });
  return r;
};
