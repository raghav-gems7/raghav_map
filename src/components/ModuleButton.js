import React from 'react';

import {
    TouchableOpacity,
    Text,
    StyleSheet,
} from 'react-native';

const ModuleButton = ({
    title,
    color,
    onPress,
}) => {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: color,
                },
            ]}
            onPress={onPress}>
            <Text style={styles.text}>
                {title}
            </Text>
        </TouchableOpacity>
    );
};

export default ModuleButton;

const styles = StyleSheet.create({
    button: {
        padding: 16,
        borderRadius: 10,
        marginBottom: 20,
        alignItems: 'center',
    },

    text: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});