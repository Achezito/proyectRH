import React, {useState} from react;
import {View, Text, TextInput, StyleSheet, Button} from 'react-native';
import { supabase } from '../../supabaseClient';



export default function RegisterScreen({navigation}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleRegister = async () => {

    const {data, error } = await supabase.auth.signUp({email, password});
    if (error) setError(error.message);
    else navigation.navigate('Login')
    };
 


    return(

        <View style = {styles.container}>
            <Text style = {styles.title}> Iniciar sesion</Text>
            <TextInput
            placeholder='Correo'
            value={email}
            onChangeText={email}
            style= {styles.input}

            />
              <TextInput
            placeholder='Contraseña'
            value={password}
            onChangeText={password}
            style= {styles.input}
            />
        {error ? <Text style={styles.error}>{error}</Text> : null }
        <Button title ="Registrarme" onPress={handleRegister}></Button>
        <Button title ="Ya tengo una cuenta" onPress={() => navigation.navigate('Login')} />
    </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 },
  error: { color: 'red', marginBottom: 10 },
});