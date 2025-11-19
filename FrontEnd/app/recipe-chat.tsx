
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

const OPENAI_API_KEY=process.env.EXPO_PUBLIC_OPENAI_API_KEY;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function RecipeChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isNewChat = params.newChat === 'true';

  const [isLoading, setIsLoading] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '안녕하세요! 보유하신 식재료를 기반으로 레시피를 추천해드릴게요. 어떤 요리를 만들고 싶으신가요?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isNewChat) {
      setMessages([
        {
          id: '1',
          text: '안녕하세요! 보유하신 식재료를 기반으로 레시피를 추천해드릴게요. 어떤 요리를 만들고 싶으신가요?',
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isNewChat]);
  
  const fetchGPTResponse = async (userQuery:string)=>{
    try{
      const response = await fetch('https://api.openai.com/v1/chat/completions',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Authorization':`Bearer ${OPENAI_API_KEY}`,
        },
        body:JSON.stringify({
          model:'gpt-3.5-turbo',
          messages:[
            {
              role:"system",
              content:"당신을 친절하고 전문적인 요리사입니다. 사용자가 가진 식재료를 기반으로 한국인이 좋아하는 맛있는 레시피 3가지 추천해주세요. 필요한 재료와 조리법을 단계별로 명확하게 설명해주세요."
            },
            {role:"user",content:userQuery}
          ],
          temperature:0.7,
        }),
      });

      const data = await response.json();

      if (data.error){
        throw new Error(data.error.message);
      }
      return data.choices[0].message.content.trim();
    } catch (error){
      console.error('GTP API Error:',error);
      Alert.alert('오류','AI 쉐프와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      return '죄송합니다. 레시피를 가져오는 중에 문제가 발생했습니다.';
    }
  };
  const handleSend = async () => {
    if (inputText.trim() === '') return;
    if (isLoading) return;
    
    const userText=inputText;
    const userMessage: Message = {
      id: Date.now().toString(),
      text:userText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    const aiReplyText= await fetchGPTResponse(userText);

    const aiMessage:Message={
      id:(Date.now()+1).toString(),
      text:aiReplyText,
      isUser:false,
      timestamp:new Date(),
    };
    
    setMessages((prev)=>[...prev,aiMessage]);
    setIsLoading(false);
  };

  const toggleFavorite=()=>{
    setIsFavorite(!isFavorite);
  };
  
  return (
    <View style ={styles.mainContainer}>
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>레시피 추천</Text>
        <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
          <IconSymbol
            name={isFavorite ? 'star.fill' : 'star'}
            size={24}
            color={isFavorite ? colors.accent : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.isUser ? styles.userMessage : styles.aiMessage,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.isUser ? styles.userMessageText : styles.aiMessageText,
              ]}
            >
              {message.text}
            </Text>
            <Text
              style={[
                styles.timestamp,
                message.isUser ? styles.userTimestamp : styles.aiTimestamp,
              ]}
            >
              {message.timestamp.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        ))}
        {isLoading&&(
          <View style={[styles.messageBubble,styles.aiMessage,{flexDirection:'row',alignItems:'center',gap:8}]}>
            <ActivityIndicator size="small" color={colors.textSecondary}/>
            <Text style={{color:colors.textSecondary,fontSize:13}}>쉐프가 레시피를 생각 중입니다...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="메시지를 입력하세요..."
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, inputText.trim() === '' && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={inputText.trim() === ''}
        >
          <IconSymbol name="arrow.up.circle.fill" size={36} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer:{
    flex:1,
    backgroundColor:'#ffffff',
  },
  keyboardView:{
    flex:1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.highlight,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  favoriteButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: colors.text,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.highlight,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 15,
    color: colors.text,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
