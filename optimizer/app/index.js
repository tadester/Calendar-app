import React, { useState } from 'react';
import { View, Text, TextInput, Picker, Button, StyleSheet, Modal, ScrollView } from 'react-native';

function TaskForm({ onSubmit }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('30');  // Default to 30 minutes
  const [taskType, setTaskType] = useState('daily');

  const handleSubmit = () => {
      const duration = parseInt(hours, 10) * 60 + parseInt(minutes, 10);
      onSubmit({
          name: taskName,
          duration,
          type: taskType
      });
      closeForm();
  };

  const closeForm = () => {
      setTaskName('');
      setHours('0');
      setMinutes('30');
      setTaskType('daily');
      setModalVisible(false);
  };

  return (
      <View style={styles.container}>
          <Text style={styles.title}>To Do List</Text>
          <Button title="Add Item" onPress={() => setModalVisible(true)} />

          <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={closeForm}
          >
              <View style={styles.modalView}>
                  <ScrollView>
                      <Text style={styles.label}>Task Name:</Text>
                      <TextInput
                          style={styles.input}
                          value={taskName}
                          onChangeText={setTaskName}
                          placeholder="Enter task name"
                      />

                      <Text style={styles.label}>Duration:</Text>
                      <Picker
                          selectedValue={hours}
                          style={styles.picker}
                          onValueChange={(itemValue) => setHours(itemValue)}
                      >
                          {Array.from({length: 24}, (_, i) => (
                              <Picker.Item key={i} label={`${i} hour(s)`} value={`${i}`} />
                          ))}
                      </Picker>
                      <Picker
                          selectedValue={minutes}
                          style={styles.picker}
                          onValueChange={(itemValue) => setMinutes(itemValue)}
                      >
                          {Array.from({length: 60}, (_, i) => (
                              <Picker.Item key={i} label={`${i} minute(s)`} value={`${i}`} />
                          ))}
                      </Picker>

                      <Text style={styles.label}>Task Type:</Text>
                      <Picker
                          selectedValue={taskType}
                          style={styles.picker}
                          onValueChange={(itemValue) => setTaskType(itemValue)}
                      >
                          <Picker.Item label="Daily" value="daily" />
                          <Picker.Item label="Weekly" value="weekly" />
                          <Picker.Item label="Monthly" value="monthly" />
                      </Picker>

                      <Button title="Submit" onPress={handleSubmit} />
                      <Button title="Cancel" onPress={closeForm} color="red" />
                  </ScrollView>
              </View>
          </Modal>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
      padding: 20,
      backgroundColor: '#fff'
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
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      marginBottom: 20,
      width: 200,
      paddingHorizontal: 10
  },
  label: {
      fontSize: 16,
      marginBottom: 5
  },
  picker: {
      height: 50,
      width: 100,
      marginBottom: 20
  },
  title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10
  }
});


export default TaskForm;
