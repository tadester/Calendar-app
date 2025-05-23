import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { View, Text, TextInput, Button, StyleSheet, Modal, ScrollView, TouchableOpacity, Picker } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

function TaskForm({ onSubmit }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [hours, setHours] = useState(0);  // For selecting hours
  const [minutes, setMinutes] = useState(0);  // For selecting minutes
  const [taskType, setTaskType] = useState('daily');
  const [tasks, setTasks] = useState([]); // State to store tasks
  const [scheduledTasks, setScheduledTasks] = useState([]); // State to store scheduled tasks

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:3000/items'); // Ensure the URL is correct and the server is running
      console.log("The url is correct");
      setTasks(response.data); // Assuming the response body directly contains the tasks array
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const optimizeTasks = async () => {
    try {
      const response = await axios.get('http://localhost:3000/optimize-schedule');
      console.log('Optimized tasks:', response.data);
      setScheduledTasks(response.data.scheduledTasks); // Update state with optimized tasks
    } catch (error) {
      console.error('Error optimizing tasks:', error);
    }
  };

  const addToCalendar = async () => {
    try {
      for (let task of scheduledTasks) {
        const response = await axios.post('http://localhost:3000/tasks', {
          title: task.taskName,
          description: task.taskName,
          duration: (task.end - task.start) / 60000,
          dueDate: task.start
        });
        console.log('Task added to calendar:', response.data);
      }
    } catch (error) {
      console.error('Failed to add task to calendar:', error);
    }
  };

  const handleSubmit = async () => {
    const duration = parseInt(hours) * 60 + parseInt(minutes);  // Calculate total duration in minutes
    try {
      const response = await axios.post('http://localhost:3000/items', {
        name: taskName,
        duration,
        type: taskType
      });
      fetchTasks();  // Fetch tasks again to update the list after adding new one
      console.log('Task created:', response.data);
      closeForm();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const closeForm = () => {
    setTaskName('');
    setHours(0);
    setMinutes(0);
    setTaskType('daily');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>To Do List</Text>
      <ScrollView style={styles.taskList}>
        {tasks.map((task, index) => (
          <Text key={index}>{task.name} - {task.type} - Duration: {task.duration} minutes</Text>
        ))}
      </ScrollView>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
        <Icon name="plus" size={15} color="#fff" />
        <Text style={styles.addButtonText}>Add Task</Text>
      </TouchableOpacity>
      <Button title="Optimize Tasks" onPress={optimizeTasks} />
      <Button title="Add to Calendar" onPress={addToCalendar} />

      <Text style={styles.title}>Scheduled Tasks</Text>
      <ScrollView style={styles.taskList}>
        {scheduledTasks.map((task, index) => (
          <Text key={index}>{task.taskName} - Start: {task.start.toLocaleString()} - End: {task.end.toLocaleString()}</Text>
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeForm}
      >
        <View style={styles.modalView}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Icon name="pencil" size={20} color="#333" />
              <TextInput
                style={styles.input}
                value={taskName}
                onChangeText={setTaskName}
                placeholder="Enter task name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Icon name="clock-o" size={20} color="#333" />
              <Picker
                selectedValue={hours}
                style={styles.picker}
                onValueChange={(itemValue) => setHours(itemValue)}
              >
                {Array.from({ length: 24 }, (_, i) => <Picker.Item key={i} label={`${i} hours`} value={i} />)}
              </Picker>
              <Picker
                selectedValue={minutes}
                style={styles.picker}
                onValueChange={(itemValue) => setMinutes(itemValue)}
              >
                {Array.from({ length: 60 }, (_, i) => <Picker.Item key={i} label={`${i} minutes`} value={i} />)}
              </Picker>
            </View>

            <View style={styles.inputGroup}>
              <Icon name="repeat" size={20} color="#333" />
              <Picker
                selectedValue={taskType}
                style={styles.picker}
                onValueChange={(itemValue) => setTaskType(itemValue)}
              >
                <Picker.Item label="Daily" value="daily" />
                <Picker.Item label="Weekly" value="weekly" />
                <Picker.Item label="Monthly" value="monthly" />
              </Picker>
            </View>

            <Button title="Submit" onPress={handleSubmit} />
            <Button title="Cancel" onPress={closeForm} color="#d9534f" />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F9F9F9'
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    marginLeft: 10
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  label: {
    fontSize: 16,
    marginBottom: 5
  },
  picker: {
    flex: 1,
    height: 50,
    width: 100,
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#007BFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 14
  },
  taskList: {
    marginBottom: 20
  }
});

export default TaskForm;
