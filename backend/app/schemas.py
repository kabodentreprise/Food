from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator, model_validator
from enum import Enum
import re
from decimal import Decimal

# Regex de validation
PHONE_NUMBER_CLEANED_REGEX = r"^\+?\d{7,20}$"
NAME_REGEX = r"^[a-zA-ZÀ-ÿ\s'-]+$"

# ----------------------------------------
# 🔐 UTILISATEURS
# ----------------------------------------

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = Field(None, min_length=2, max_length=50, pattern=NAME_REGEX)
    last_name: Optional[str] = Field(None, min_length=2, max_length=50, pattern=NAME_REGEX)
    phone_number: Optional[str] = None
    delivery_address: Optional[str] = Field(None, min_length=5, max_length=200)

    @model_validator(mode='before')
    @classmethod
    def clean_phone_number(cls, data: Any) -> Any:
        if isinstance(data, dict) and 'phone_number' in data and data['phone_number']:
            phone = str(data['phone_number'])
            data['phone_number'] = '+' + re.sub(r'\D', '', phone[1:]) if phone.startswith('+') else re.sub(r'\D', '', phone)
        return data

    @field_validator('phone_number')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v and not re.fullmatch(PHONE_NUMBER_CLEANED_REGEX, v):
            raise ValueError("Numéro de téléphone invalide (7 à 20 chiffres, avec ou sans '+').")
        return v

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    is_active: Optional[bool] = True
    is_admin: Optional[bool] = False
    is_super_admin: Optional[bool] = False
    is_livreur: Optional[bool] = False

class UserUpdate(UserBase):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    is_super_admin: Optional[bool] = None
    is_livreur: Optional[bool] = None

class UserOut(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    is_super_admin: bool
    is_livreur: bool
    model_config = ConfigDict(from_attributes=True)

# ----------------------------------------
# 🔐 AUTHENTIFICATION
# ----------------------------------------

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    model_config = ConfigDict(from_attributes=True)

class TokenData(BaseModel):
    user_id: Optional[int] = None

# ----------------------------------------
# 📂 CATÉGORIES
# ----------------------------------------

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, pattern=NAME_REGEX)

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# ----------------------------------------
# 🧾 MENUS
# ----------------------------------------

class MenuBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: Decimal = Field(..., gt=0, decimal_places=2)
    description: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = None
    is_favorite: Optional[bool] = False
    category_id: int

class MenuCreate(MenuBase): pass

class MenuUpdate(BaseModel):
    name: Optional[str]
    price: Optional[Decimal]
    description: Optional[str]
    image_url: Optional[str]
    is_favorite: Optional[bool]
    category_id: Optional[int]
    model_config = ConfigDict(from_attributes=True)

class MenuOut(MenuBase):
    id: int
    category: Optional[CategoryOut] = None
    model_config = ConfigDict(from_attributes=True)

# ----------------------------------------
# 📦 COMMANDES
# ----------------------------------------

class OrderStatus(str, Enum):
    EN_ATTENTE = "en_attente"
    PAYE = "payé"
    EN_PREPARATION = "en_preparation"
    PRET = "prêt"
    EN_CHEMIN = "en_chemin" # <-- AJOUT ICI !
    LIVRE = "livré"
    ANNULEE = "annulée"
    REMBOURSEE = "remboursée"

class OrderItemBase(BaseModel):
    menu_id: int
    quantity: int = Field(..., gt=0)

class OrderItemOut(OrderItemBase):
    id: int
    order_id: int
    menu: Optional[MenuOut]
    model_config = ConfigDict(from_attributes=True)

class OrderCreate(BaseModel):
    items: List[OrderItemBase]
    delivery_address: Optional[str] = Field(None, min_length=5, max_length=200)
    # AJOUT IMPORTANT : Ce champ assure que Pydantic valide le statut
    status: Optional[OrderStatus] = None

class OrderAssignLivreur(BaseModel):
    livreur_id: int 

class OrderOut(BaseModel):
    id: int
    user_id: int
    status: OrderStatus
    total: Decimal
    tva_amount: Optional[Decimal] = None
    created_at: datetime
    updated_at: Optional[datetime]
    updated_by: Optional[str]
    delivery_address: Optional[str]
    # Re-inclusion de assigned_livreur_id et livreur comme demandé
    assigned_livreur_id: Optional[int]
    items: List[OrderItemOut] = []
    user: Optional[UserOut] = None
    livreur_user: Optional[UserOut] = None
    model_config = ConfigDict(from_attributes=True)

class OrderUpdateStatus(BaseModel):
    status: OrderStatus

# ----------------------------------------
# 💳 PAIEMENT
# ----------------------------------------

class PaymentBase(BaseModel):
    order_id: int
    status: str
    faydapay_ref: str
    type: Optional[str] = "payment"
    amount: Optional[float] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(BaseModel):
    status: Optional[str] = None
    faydapay_ref: Optional[str] = None
    type: Optional[str] = None
    amount: Optional[float] = None

class PaymentInDB(PaymentBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        model_config = ConfigDict(from_attributes=True)

# ----------------------------------------
# 🔐 PASSWORD RESET
# ----------------------------------------

class PasswordResetTokenBase(BaseModel):
    token: str = Field(..., min_length=32, max_length=64)
    expires_at: datetime

class PasswordResetTokenCreate(PasswordResetTokenBase):
    user_id: int

class PasswordResetToken(PasswordResetTokenBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)

# ----------------------------------------
# 📜 HISTORIQUE DE COMMANDE
# ----------------------------------------

class OrderHistoryOut(BaseModel):
    id: int
    order_id: int
    ancien_statut: str
    nouveau_statut: str
    modifie_par: Optional[str]
    role: Optional[str]
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

# ----------------------------------------
# 🧾 FOOTER + À PROPOS
# ----------------------------------------

class FooterSettingsBase(BaseModel):
    address: Optional[str] = Field(None, min_length=5, max_length=200)
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    title: Optional[str]
    history_title: Optional[str]
    history_content: Optional[str]
    restaurant_today_title: Optional[str]
    restaurant_today_content: Optional[str]
    achievements_title: Optional[str]
    achievements_content: Optional[str]

    @model_validator(mode='before')
    @classmethod
    def clean_phone_number_footer(cls, data: Any) -> Any:
        if isinstance(data, dict) and data.get("phone_number"):
            phone = str(data["phone_number"])
            data["phone_number"] = '+' + re.sub(r'\D', '', phone[1:]) if phone.startswith('+') else re.sub(r'\D', '', phone)
        return data

    @field_validator('phone_number')
    @classmethod
    def validate_phone_footer(cls, v: Optional[str]) -> Optional[str]:
        if v and not re.fullmatch(PHONE_NUMBER_CLEANED_REGEX, v):
            raise ValueError("Numéro de téléphone invalide.")
        return v

class FooterSettingsCreate(FooterSettingsBase):
    pass
class FooterSettingsUpdate(FooterSettingsBase):
    pass

class FooterSettingsOut(FooterSettingsBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class AboutContentOut(BaseModel):
    id: int
    title: Optional[str]
    history_title: Optional[str]
    history_content: Optional[str]
    restaurant_today_title: Optional[str]
    restaurant_today_content: Optional[str]
    achievements_title: Optional[str]
    achievements_content: Optional[str]
    model_config = ConfigDict(from_attributes=True)