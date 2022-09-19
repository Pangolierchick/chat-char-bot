import {buySubscribtionCallBack, giveSubscribtionCallBack} from '.';
import {meditationSaverCallback} from './meditationSaver';
import {MyContext, MyConversation, Meditation} from './types';
import {durationToPrice, validatePhoneNumber} from './util';

export async function addMeditation(conversation: MyConversation, context: MyContext) {
  await context.reply('Чтобы добавить медитацию, напишите подпись к ней.');
  const caption = (await conversation.waitFor(':text')).msg.text;
  await context.reply('Отправьте голосовое сообщение.');
  const audio = (await conversation.waitFor(':voice')).msg.voice;
  await context.reply('Отправьте картинку.');
  const picture = (await conversation.waitFor(':photo')).msg.photo;

  await context.reply('Результат:');
  await context.replyWithVoice(audio.file_id, {caption: caption});
  await context.replyWithPhoto(picture[0].file_id);
  const meditation: Meditation = {
    voiceId: audio.file_id,
    caption: caption,
    pictureId: picture[0].file_id,
  };

  await conversation.external(async () => await meditationSaverCallback(meditation));
}

export async function buySubscription(conversation: MyConversation, context: MyContext) {
  await context.reply('Напишите, пожалуйста, свой номер телефона, привязанный к QIWI кошельку, чтобы система смогла опознать Ваш платеж. (Обязательно в таком формате +791234567890). Не беспокойтесь, мы не храним нигде Ваш номер телефона. Для отмены операции напишите "Отмена"');
  let rightPhone = false;
  let phoneNumber: string;
  while (!rightPhone) {
    phoneNumber = (await conversation.waitFor(':text')).msg.text;
    if (phoneNumber.toLowerCase() === 'отмена') {
      await context.reply('Операция была отменена');
      return;
    }

    rightPhone = validatePhoneNumber(phoneNumber);
    if (!rightPhone) {
      await context.reply('Номер телефона обязательно должен быть написан по шаблону +791234567890. Попробуйте еще раз');
    }
  }

  await context.reply(`Теперь отправьте сумму ${durationToPrice(context.session.duration)} руб. на кошелек QIWI: ${context.session.walletId}. Система автоматически распознает платеж и уведомит Вас об этом. В случае, если уведомление не приходит в течение 10-15 минут, выберите пункт Помощь в основном меню.`);

  await conversation.external(async () => await buySubscribtionCallBack(context.chat!.id, phoneNumber, context.session.duration, context));
}

export async function giveSubscribtion(conversation: MyConversation, context: MyContext) {
  await context.reply('Напишите айди пользователя (он может его получить нажав на кнопку Помощь)');
  const chatId = await conversation.form.int();
  await giveSubscribtionCallBack(chatId, context.session.duration, context);
}
