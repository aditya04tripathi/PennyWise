// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'card_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class PaymentCardAdapter extends TypeAdapter<PaymentCard> {
  @override
  final int typeId = 5;

  @override
  PaymentCard read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return PaymentCard(
      id: fields[0] as String,
      bankName: fields[1] as String,
      cardHolderName: fields[2] as String,
      lastFourDigits: fields[3] as String,
      cardType: fields[5] as CardType,
      maskedNumber: fields[6] as String,
      colorValue: fields[7] as int,
    );
  }

  @override
  void write(BinaryWriter writer, PaymentCard obj) {
    writer
      ..writeByte(7)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.bankName)
      ..writeByte(2)
      ..write(obj.cardHolderName)
      ..writeByte(3)
      ..write(obj.lastFourDigits)
      ..writeByte(5)
      ..write(obj.cardType)
      ..writeByte(6)
      ..write(obj.maskedNumber)
      ..writeByte(7)
      ..write(obj.colorValue);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PaymentCardAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class CardTypeAdapter extends TypeAdapter<CardType> {
  @override
  final int typeId = 4;

  @override
  CardType read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return CardType.visa;
      case 1:
        return CardType.mastercard;
      case 2:
        return CardType.amex;
      case 3:
        return CardType.discover;
      case 4:
        return CardType.other;
      default:
        return CardType.visa;
    }
  }

  @override
  void write(BinaryWriter writer, CardType obj) {
    switch (obj) {
      case CardType.visa:
        writer.writeByte(0);
        break;
      case CardType.mastercard:
        writer.writeByte(1);
        break;
      case CardType.amex:
        writer.writeByte(2);
        break;
      case CardType.discover:
        writer.writeByte(3);
        break;
      case CardType.other:
        writer.writeByte(4);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CardTypeAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
