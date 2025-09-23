import React, {useContext, useState} from react;
import {View, Text, TextInput,Button, StyleSheet} from 'react-native';
import { supabase } from '../../supabaseClient';
import { AuthContext } from '../context/AuthContext';


export default function LoginScreen({navigation}) {
    const { setUser } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        const {data, error } = await supabase.auth.signInWithPassword({email, password});
        if (error) setError(error.message);
       else setUser(data.user)
    };

    return (
        <View style= {styles.container}>
            <Text style= {styles.title}>Iniciar Sesion</Text>
            <TextInput
                placeholder='Correo'
                value={email}
                onChangeText={setEmail}
                style={styles.input}

                
            />
            <TextInput
                placeholder='Contraseña'
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
            />
            {error? <Text style={styles.error}>{error}</Text> : null}
            <Button title= "Entrar" onPress= {handleLogin} />
            <Button title= "Registrarse" onPress={()=> navigation.navigate("Register")} />
            </View>           
            
            );

    }

    const styles = StyleSheet.create({
        container: {flex: 1, justifyContent: 'center', padding: 20},
        title: {fontSize: 24, fontWeight:'bold', marginBottom:20, textAlign:'center'},
        input: {borderWidth: 1, padding:10, marginBottom: 10, borderRadius: 5},
        error: { color: 'red', marginBottom: 10},
    });