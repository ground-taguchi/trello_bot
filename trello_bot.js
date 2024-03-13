// Trello APIキーとトークン
var trelloApiKey = '';
var trelloToken = '';

// Line Notifyトークン
var lineNotifyToken = '';

// TrelloボードID
var trelloBoardId = '';

function main() {
  var cards = getNearDueDateCards();
  if (cards.length > 0) {
    sendLineNotification(cards);
  }
}

function formatDateTime(dateString) {
  var date = new Date(dateString);
  var year = date.getFullYear();
  var month = ('0' + (date.getMonth() + 1)).slice(-2);
  var day = ('0' + date.getDate()).slice(-2);
  var hours = ('0' + date.getHours()).slice(-2);
  var minutes = ('0' + date.getMinutes()).slice(-2);
  return year + '/' + month + '/' + day + ' ' + hours + ':' + minutes;
}

function getNearDueDateCards() {
  var url = 'https://api.trello.com/1/boards/' + trelloBoardId + '/cards?key=' + trelloApiKey + '&token=' + trelloToken;
  var response = UrlFetchApp.fetch(url);
  var cards = JSON.parse(response.getContentText());

  // 期限が1日以内かつ未完了のカードを抽出
  var nearDueDateCards = cards.filter(function(card) {
    if (!card.dueComplete) {
      var dueDate = formatDateTime(card.due);
      var today = new Date();
      var timeDiff = new Date(dueDate).getTime() - today.getTime();
      var daysDiff = timeDiff / (1000 * 3600 * 24);
      return daysDiff <= 1 && daysDiff > 0;  // 2日以内かつ非負の場合
    } else {
      return false; // 完了済みのカードは除外
    }
  });

  return nearDueDateCards;
}

function getMemberNames(card) {
  if (card.idMembers.length > 0) {
    var memberNames = card.idMembers.map(function(memberId) {
      var memberUrl = 'https://api.trello.com/1/members/' + memberId + '?key=' + trelloApiKey + '&token=' + trelloToken;
      var memberResponse = UrlFetchApp.fetch(memberUrl);
      var member = JSON.parse(memberResponse.getContentText());
      return member.fullName;
    });
    return memberNames.join(', ');
  } else {
    return 'なし';
  }
}

function sendLineNotification(cards) {
  var message = '\n期限が近づいてるよ！\n進捗教えて！\n\n';

  cards.forEach(function(card) {
    var formattedDueDateTime = formatDateTime(card.due);
    var memberNames = getMemberNames(card);
    message += '「' + card.name + '」\n' + '担当者： ' + memberNames +   '\n期限： ' + formattedDueDateTime + 'まで\n\n';
  });

  var lineUrl = 'https://notify-api.line.me/api/notify';
  var headers = {
    'Authorization': 'Bearer ' + lineNotifyToken,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  var payload = {
    'method': 'post',
    'headers': headers,
    'payload': 'message=' + encodeURIComponent(message),
  };

  UrlFetchApp.fetch(lineUrl, payload);
}
