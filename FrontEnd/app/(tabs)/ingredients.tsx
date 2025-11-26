
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

const INGREDIENTS_KEY='user_ingredients'

export default function IngredientsScreen() {
  const [ingredients, setIngredients]=useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(()=>{
    const loadIngredients = async() =>{
      try{
        const savedData = await AsyncStorage.getItem(INGREDIENTS_KEY);
        if(savedData){
          setIngredients(JSON.parse(savedData));
        }else{
          const defaultIngredients=['양파','당근','감자','돼지고기','계란','대파','마늘','고추'];
          setIngredients(defaultIngredients);
          await AsyncStorage.setItem(INGREDIENTS_KEY,JSON.stringify(defaultIngredients));
        }
      }catch(e){
        console.error('재료 불러오기 실패:',e);
      }
    };
    loadIngredients();
  },[]);

  const saveIngredients = async (newList: string[])=>{
    setIngredients(newList);
    try{
      await AsyncStorage.setItem(INGREDIENTS_KEY,JSON.stringify(newList));
    }catch(e){
      console.error('재료 저장 실패: ',e)
    }
  }

  const handleAddIngredient = () => {
    if (newIngredient.trim() !== '') {
      const newList = [...ingredients,newIngredient.trim()];
      saveIngredients(newList);
      setNewIngredient('');
      setShowAddModal(false);
    }
  };

  const handleDeleteIngredient = (index: number) => {
    const newList = ingredients.filter((_,i)=>i!==index);
    saveIngredients(newList);
  };

  const filteredIngredients = ingredients.filter((ingredient) =>
    ingredient.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>보유 식재료</Text>
        <Text style={styles.headerSubtitle}>
          {ingredients.length}개의 식재료
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="식재료 검색..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <IconSymbol name="xmark.circle.fill" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.ingredientsGrid}>
          {filteredIngredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientCard}>
              <Text style={styles.ingredientName}>{ingredient}</Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteIngredient(index)}
              >
                <IconSymbol name="xmark.circle.fill" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {filteredIngredients.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol name="magnifyingglass" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>검색 결과가 없습니다</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <IconSymbol name="plus.circle.fill" size={24} color="#FFFFFF" />
        <Text style={styles.addButtonText}>식재료 추가</Text>
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>식재료 추가</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="식재료 이름을 입력하세요"
              placeholderTextColor={colors.textSecondary}
              value={newIngredient}
              onChangeText={setNewIngredient}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowAddModal(false);
                  setNewIngredient('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButtonConfirm,
                  newIngredient.trim() === '' && styles.modalButtonDisabled,
                ]}
                onPress={handleAddIngredient}
                disabled={newIngredient.trim() === ''}
              >
                <Text style={styles.modalButtonConfirmText}>추가</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.highlight,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ingredientCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  deleteButton: {
    padding: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  addButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: colors.highlight,
    borderRadius: 8,
    paddingVertical: 12,
  },
  modalButtonCancelText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButtonConfirm: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
