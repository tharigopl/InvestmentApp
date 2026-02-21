// client/screens/LoginScreen.js - UPDATED WITH NEW THEME
import { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../store/auth-context';
import { logintdtserver } from '../util/auth';

function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const authCtx = useContext(AuthContext);

  async function loginHandler() {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password');
      return;
    }

    setIsAuthenticating(true);
    try {
      const token = await logintdtserver(email, password);
      console.log("Login successful:", token.token, token.userId);
      
      authCtx.authenticate(token.token);
      authCtx.addUid(token.userId);
      authCtx.saveStripeUserId(token.stripeuser ? token.stripeuser : "");
      
      if (token.data === 'You entered the wrong password.') {
        Alert.alert(
          'Authentication failed!',
          'Could not log you in. Please check your credentials or try again later!'
        );
        setIsAuthenticating(false);
      }
    } catch (error) {
      console.log("Login error:", error);
      Alert.alert(
        'Authentication failed!',
        'Could not log you in. Please check your credentials or try again later!'
      );
      setIsAuthenticating(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerEmoji}>💰</Text>
          <Text style={styles.headerTitle}>Welcome Back!</Text>
          <Text style={styles.headerSubtitle}>Log in to manage your investment events</Text>
        </LinearGradient>

        {/* Login Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Login to Your Account</Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="mail" size={20} color="#FF6B6B" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="lock-closed" size={20} color="#FF6B6B" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={20} 
                color="#999" 
              />
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={loginHandler}
            disabled={isAuthenticating}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {isAuthenticating ? (
                <Text style={styles.buttonText}>Logging in...</Text>
              ) : (
                <>
                  <Ionicons name="log-in" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Login</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign Up Link */}
          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.signupText}>
              Don't have an account?{' '}
              <Text style={styles.signupLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerEmoji}>🎁</Text>
          <Text style={styles.footerText}>
            Create investment events and give the gift of stocks to your loved ones!
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#fff',
    margin: 24,
    marginTop: -20,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputIconContainer: {
    width: 48,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  eyeButton: {
    width: 48,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  signupButton: {
    paddingVertical: 12,
  },
  signupText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  signupLink: {
    color: '#FF6B6B',
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  footerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
});

export default LoginScreen;