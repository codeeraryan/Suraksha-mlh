import { Image, StyleSheet, Text, View } from 'react-native'


const SplashScreen = () => {
    return (

        <View style={styles.container}>
            <Image
                source={require('../assets/logo.png')}
                style={styles.logoImg}
            />
        </View>

    )
}

export default SplashScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: "center"
    },
    logoImg: {
        width: 250,
        height: 250
    }
})