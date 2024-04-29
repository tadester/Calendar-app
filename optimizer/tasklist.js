import React, { useState } from 'react';
import { View, Text, TextInput, Picker, Button, StyleSheet } from 'react-native';

function TaskForm({ onSubmit }) {
    const [taskName, setTaskName] = useState('');
    const [duration, setDuration] = useState('');
    const [taskType, setTaskType] = useState('daily');

    const handleSubmit = () => {
        onSubmit({
            name: taskName,
            duration: parseInt(duration, 10),
            type: taskType
        });
        setTaskName('');
        setDuration('');
        setTaskType('daily');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Task Name:</Text>
            <TextInput
                style={styles.input}
                value={taskName}
                onChangeText={setTaskName}
                placeholder="Enter task name"
            />

            <Text style={styles.label}>Duration (minutes):</Text>
            <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                placeholder="Enter duration in minutes"
                keyboardType="numeric"
            />

            <Text style={styles.label}>Task Type:</Text>
            <Picker
                selectedValue={taskType}
                style={styles.picker}
                onValueChange={(itemValue, itemIndex) => setTaskType(itemValue)}
            >
                <Picker.Item label="Daily" value="daily" />
                <Picker.Item label="Weekly" value="weekly" />
                <Picker.Item label="Monthly" value="monthly" />
            </Picker>

            <Button
                title="Add Task"
                onPress={handleSubmit}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff'
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 20,
        paddingHorizontal: 10
    },
    label: {
        fontSize: 16,
        marginBottom: 5
    },
    picker: {
        height: 50,
        marginBottom: 20
    }
});

export default TaskForm;
