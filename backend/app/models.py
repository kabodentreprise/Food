# C:\Users\hp\Documents\AfriqFood\backend\app\models.py
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_livreur = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    is_super_admin = Column(Boolean, default=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    delivery_address = Column(String, nullable=True)

    orders = relationship("Order", back_populates="user", foreign_keys="[Order.user_id]", cascade="all, delete-orphan")
    assigned_orders = relationship("Order", back_populates="livreur_user", foreign_keys="[Order.assigned_livreur_id]")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    menus = relationship("Menu", back_populates="category", cascade="all, delete-orphan")

class Menu(Base):
    __tablename__ = "menus"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    is_favorite = Column(Boolean, default=False)
    description = Column(String, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"))

    category = relationship("Category", back_populates="menus")
    order_items = relationship("OrderItem", back_populates="menu", cascade="all, delete-orphan")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    assigned_livreur_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Déplacé ici
    status = Column(String, default="en attente")
    tva_amount = Column(Numeric(10, 2), nullable=True)
    total = Column(Numeric(10, 2), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(String, nullable=True)
    delivery_address = Column(String, nullable=True)

    # Définissez toutes les colonnes avant les relations
    # Relations maintenant définies après toutes les colonnes
    user = relationship("User", back_populates="orders", foreign_keys=[user_id])
    livreur_user = relationship("User", back_populates="assigned_orders", foreign_keys=[assigned_livreur_id]) # Maintenant 'assigned_livreur_id' est défini
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    menu_id = Column(Integer, ForeignKey("menus.id"))
    quantity = Column(Integer, default=1)

    order = relationship("Order", back_populates="items")
    menu = relationship("Menu", back_populates="order_items")

class OrderHistory(Base):
    __tablename__ = "order_history"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    ancien_statut = Column(String, nullable=False)
    nouveau_statut = Column(String, nullable=False)
    modifie_par = Column(String, nullable=True)
    role = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", backref="history")


class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    status = Column(String, nullable=False)
    faydapay_ref = Column(String, nullable=False)
    type = Column(String, default="payment")
    amount = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    order = relationship("Order", back_populates="payments")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="password_reset_tokens")

class FooterSettings(Base):
    __tablename__ = "footer_settings"
    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    email = Column(String, nullable=True)

    title = Column(String, nullable=True)
    history_title = Column(String, nullable=True)
    history_content = Column(String, nullable=True)
    restaurant_today_title = Column(String, nullable=True)
    restaurant_today_content = Column(String, nullable=True)
    achievements_title = Column(String, nullable=True)
    achievements_content = Column(String, nullable=True)