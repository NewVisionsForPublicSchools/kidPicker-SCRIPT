function doGet() {
  var app = UiApp.createApplication();
  var ssKey = UserProperties.getProperty('kidPicker_ssKey');
  var ssAnchor = app.createAnchor('', '').setId('ssAnchor');
  var decoratedPanel = app.createDecoratedPopupPanel().setStyleAttribute('margin', '20px').setWidth("250px");
  var panel = app.createVerticalPanel().setId('decoratedPanel');
  var imagePanel = app.createHorizontalPanel();
  var image = app.createImage('https://c04a7a5e-a-3ab37ab8-s-sites.googlegroups.com/a/newvisions.org/data-dashboard/searchable-docs-collection/picker-small.gif?attachauth=ANoY7cphgVRECOa2HZAISj8ZZn77d41H0QZcNT5ivEQOju22E9Zq1yL_cCznj9yrE12EPiMdYTDQQ55asa_Oic4PBnq-2I5WofeB8H68XUB9PJ5zhaZULJ7Rv-gJLmuV1FGPzrOR5sPf7EBcYzNY-p3J3iMswWhoht6Cl3vE558WK7uPRr1M3y-GRR9xiZsMXaAiY_bdPrMbaMDn__CdxtUTr4-U4UoatCNQBCyy07OBw3f70B8ra0thWJhpaPtJaL9vDa_2obcV&attredirects=0');
  image.setWidth('50px').setHeight('50px').setStyleAttribute('marginLeft', '10px');
  imagePanel.add(image);
  imagePanel.add(app.createLabel('kidPicker').setStyleAttribute('fontSize', '25px').setStyleAttribute('margin', '10px'));
  if ((!ssKey)||(ssKey=='')) {
    var firstTimeLabel = app.createLabel("Complete initial setup...").setStyleAttribute('margin', '10px');
    var createButton = app.createButton("Create new tracker spreadsheet");
    var createHandler = app.createServerHandler('createKidTracker');
    var createClickHandler = app.createClientHandler().forTargets(createButton).setEnabled(false);
    createButton.addClickHandler(createHandler).addClickHandler(createClickHandler);
    panel.add(imagePanel);
    panel.add(firstTimeLabel);
    panel.add(createButton);
    decoratedPanel.add(panel);
    app.add(decoratedPanel);
    var attributionPanel = app.createHorizontalPanel();
    var text = app.createHTML('kidPicker is a tool that equitably randomizes the student selection process, allowing a teacher to maximize the spread of students selected on the same day. It also tracks simple teacher scorings (1,2,3) in a Google Spreadsheet. Developed by educator Andrew Stillman.');
    text.setStyleAttribute('marginLeft', '25px').setStyleAttribute('marginRight', '25px').setStyleAttribute('marginTop', '10px');
    attributionPanel.add(text);
    app.add(attributionPanel);
    return app;
  } else {
    var ss = SpreadsheetApp.openById(ssKey);
    ssAnchor.setHTML(ss.getName());
    ssAnchor.setHref(ss.getUrl());
    var sheets = ss.getSheets();
    var sheetNames = [];
    var listBox = app.createListBox().setName('sheetName').setStyleAttribute('margin', '10px').setStyleAttribute('fontSize', '15px');
    listBox.addItem("Select section");
    var selected = CacheService.getPrivateCache().get('sheetName');
    var sheetNames = [];
    for (var i = 0; i<sheets.length; i++) {
      if ((sheets[i].getName()!="Read Me")&&(sheets[i].getName()!="ButtonValues")) {
        listBox.addItem(sheets[i].getName()).setStyleAttribute('fontSize', '15px');
        sheetNames.push(sheets[i].getName());
      }
    }
    var studentName = app.createLabel(' ').setStyleAttribute('width', '200px').setStyleAttribute('padding', '15px').setStyleAttribute('backgroundColor', 'whiteSmoke').setStyleAttribute('height', '25px').setId('studentName').setStyleAttribute('margin', '10px').setStyleAttribute('fontSize', '20px').setStyleAttribute('color', 'black');
    var hiddenName = app.createHidden('studentName').setId('hiddenName');
    if ((selected)&&(selected!='Select section')) {
      try {
        listBox.setSelectedIndex(sheetNames.indexOf(selected) + 1); 
        var sheet = ss.getSheetByName(selected);
      } catch(err) {
        var sheet = ss.getSheets();
        listBox.setSelectedIndex(1);
      }   
      var values = sheet.getDataRange().getValues();
      var student = fetchStudent(sheet);
      studentName.setText(student);
      hiddenName.setValue(student);
    }
    var scalePanel = app.createHorizontalPanel().setWidth("250px");
    
    var buttonValues = getButtonValues(ssKey);
    
    var buttonWidth = Math.round(180/(buttonValues.length));
    
    var buttonClientHandlers = [];
    var buttonServerHandlers = [];
    var buttons = [];
    var values = [];
    
    for (var i=0; i<buttonValues.length; i++) {
      buttons[i] = app.createButton(buttonValues[i]).setStyleAttribute('background','#C0C0C0').setEnabled(false).setId('button-'+i).setStyleAttribute('padding', '10px').setStyleAttribute('minWidth', buttonWidth + "px").setHeight("40px").setStyleAttribute('fontSize', '15px').setStyleAttribute('margin', '10px');
      values[i] = app.createHidden().setValue(buttonValues[i]).setName('value');
      buttonServerHandlers[i] = app.createServerHandler('logScore').addCallbackElement(hiddenName).addCallbackElement(listBox).addCallbackElement(values[i]);
      buttonClientHandlers[i] = app.createClientHandler().forTargets(buttons[i]).setStyleAttribute('background', 'orange');
      buttons[i].addClickHandler(buttonServerHandlers[i]).addClickHandler(buttonClientHandlers[i]); 
      scalePanel.add(buttons[i]).add(values[i])
    }
  
    var bottomButtonPanel = app.createHorizontalPanel();
    var button = app.createButton('Pick next student').setStyleAttribute('margin', '10px').setStyleAttribute('fontSize', '15px').setId('nextButton');
    var buttonHandler = app.createServerHandler('refreshStudent').addCallbackElement(listBox);
   
    var sheetChangeHandler = app.createServerHandler('refreshStudent').addCallbackElement(panel);
   

    var absButton = app.createButton('Mark absent').setStyleAttribute('background', '#C0C0C0').setEnabled(false).setStyleAttribute('margin', '10px').setStyleAttribute('fontSize', '15px').setId('absButton');
    var absValue = app.createHidden().setValue("Abs").setName('value');
    var absHandler = app.createServerHandler('logScore').addCallbackElement(absValue).addCallbackElement(listBox).addCallbackElement(hiddenName);
    var absClientHandler = app.createClientHandler().forTargets(absButton).setStyleAttribute('background','orange');
    absButton.addClickHandler(absHandler).addClickHandler(absClientHandler); 
    var sheetChangeClientHandler = app.createClientHandler().forTargets(buttons,absButton).setEnabled(true).setStyleAttribute('background', '#C0C0C0').forTargets(studentName).setStyleAttribute('opacity', '0.1');
    listBox.addChangeHandler(sheetChangeHandler).addChangeHandler(sheetChangeClientHandler);     
    
    
    var buttonEnableHandler = app.createClientHandler().forTargets(buttons,absButton).setEnabled(true).setStyleAttribute('background', '#C0C0C0').forTargets(studentName).setStyleAttribute('opacity', '0.1');
    button.addClickHandler(buttonHandler).addClickHandler(buttonEnableHandler);
    
    var buttonDisableHandler = app.createClientHandler().forTargets(buttons,absButton).setEnabled(false).forTargets(studentName).setStyleAttribute('color', '#C0C0C0');
    
    for (var i=0; i<buttonValues.length; i++) {
      buttons[i].addClickHandler(buttonDisableHandler);
      if ((selected)&&(selected!='Select section')) {
        buttons[i].setEnabled(true);
        absButton.setEnabled(true);
      }
      if (student=="No more students")  {
         buttons[i].setEnabled(false);
      }
      if (student=="No students in roster") {
        buttons[i].setEnabled(false);
      }
    }
    absButton.addClickHandler(buttonDisableHandler);
    
    var startNewHandler = app.createServerHandler('startNewCol').addCallbackElement(listBox);    
    var startNewColButton = app.createButton("Start again").setId("newColButton").setStyleAttribute('margin', '10px').setVisible(false);
    var startNewClientHandler = app.createClientHandler().forTargets(startNewColButton).setEnabled(false);
    startNewColButton.addClickHandler(startNewHandler).addClickHandler(startNewClientHandler).addClickHandler(buttonEnableHandler);
    
    if (student=="No more students")  {
      var button = app.getElementById('nextButton');
      var newColButton = app.getElementById('newColButton');
      absButton.setEnabled(false);
      button.setEnabled(false);
      newColButton.setVisible(true);
    }
    
  if (student=="No students in roster") {
      absButton.setEnabled(false);
      button.setEnabled(false);
  }
    
    var linkToSs = app.createAnchor("kidPicker Spreadsheet", ss.getUrl()).setStyleAttribute('marginLeft', '10px');
    panel.add(imagePanel);
    panel.add(listBox);
    panel.add(studentName);
    panel.add(hiddenName);
    panel.add(scalePanel);
    bottomButtonPanel.add(button).add(absButton);
    panel.add(bottomButtonPanel);
    panel.add(startNewColButton);
    panel.add(linkToSs);
    decoratedPanel.add(panel);
    app.add(decoratedPanel);
    var attributionPanel = app.createHorizontalPanel();
    var text = app.createHTML('kidPicker is a tool that equitably randomizes the student selection process, allowing a teacher to maximize the spread of students selected on the same day. It also tracks simple teacher scorings (1,2,3) in a Google Spreadsheet. Developed by educator Andrew Stillman.');
    text.setStyleAttribute('marginLeft', '25px').setStyleAttribute('marginRight', '25px').setStyleAttribute('marginTop', '10px');
    attributionPanel.add(text);
    app.add(attributionPanel);
    return app;
  }
}

function logScore(e) {
  var app = UiApp.getActiveApplication();
  var value = e.parameter.value;
  var sheetName = e.parameter.sheetName;
  var studentName = e.parameter.studentName;
  var ssKey = UserProperties.getProperty('kidPicker_ssKey');
  var ss = SpreadsheetApp.openById(ssKey);
  var sheet = ss.getSheetByName(sheetName);
  dateCompare(ss, sheet)
  var students = sheet.getRange(2, 1, sheet.getLastRow()-1, sheet.getLastColumn()).getValues();
  for (var i=0; i<students.length; i++) {
    var thisStudentName = students[i][0].trim() + " " + students[i][1].trim();
    if (studentName == thisStudentName) {
      sheet.getRange(i+2, sheet.getLastColumn()).setValue(value);
    }
  }
  return app;
}


function getButtonValues(ssKey) {
   var buttonValues = CacheService.getPrivateCache().get('buttonValues');
    if (!buttonValues) {
      buttonValues = fetchButtonValues(ssKey);
      buttonValues = buttonValues.join(",");
      CacheService.getPrivateCache().put(ssKey, buttonValues,300);
      buttonValues = buttonValues.split(",");
    } else {
      buttonValues.split(",");
    }
  return buttonValues;
}



function fetchButtonValues(ssKey) {
  var ss = SpreadsheetApp.openById(ssKey);
  var buttonSheet = ss.getSheetByName('ButtonValues');
  if (buttonSheet) {
    var buttonValues = buttonSheet.getRange(1, 1, 1, buttonSheet.getLastColumn()).getValues()[0];
  } else {
    var buttonValues = createButtonSheet(ss);
  }
  return buttonValues;
}


function createButtonSheet(ss) {
   var buttonSheet = ss.insertSheet("ButtonValues");
   var buttonValues = [["1","2","3"]];
   buttonSheet.getRange(1, 1, 1, 3).setValues(buttonValues);
   SpreadsheetApp.flush();
   return buttonValues[0];
}


function createKidTracker() {
  var app = UiApp.getActiveApplication();
  var decoratedPanel = app.getElementById('decoratedPanel');
  var ss = SpreadsheetApp.create('kidPicker participation tracker');
  UserProperties.setProperty('kidPicker_ssKey', ss.getId());
  var sheet1 = ss.getSheets()[0].setName('Class 1');
  var sheet2 = ss.insertSheet("Class 2");
  var readMeSheet = ss.insertSheet("Read Me");
  readMeSheet.getRange(1, 1).setValue("This spreadsheet will be used to hold scores for students selected using the kidPicker web app. To alter the scoring button values, change the values in the ButtonValues sheet. You can also increase or decrease the number of buttons.");
  readMeSheet.setColumnWidth(1, 400);
  var headers = [["FirstName","LastName"]];
  sheet1.getRange(1, 1, 1, 2).setValues(headers);
  sheet1.setFrozenRows(1);
  sheet2.getRange(1, 1, 1, 2).setValues(headers);
  sheet2.setFrozenRows(1);
  createButtonSheet(ss);
  decoratedPanel.add(app.createLabel('A spreadsheet called "kidPicker participation tracker" has been created in your Drive.  Refresh your browser to see the full kidPicker interface.').setStyleAttribute('margin', '25px'));
  return app;
}

function fetchStudent(sheet) {
  var lastCol = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  if (lastRow>1) {
    var students = sheet.getRange(2, 1, lastRow-1, 2).getValues();
    var values = sheet.getRange(2, lastCol, lastRow-1, 1).getValues();
    var eligibleStudents = [];
    for (var i=0; i<values.length; i++) {
      if (values[i][0]=='') {
        eligibleStudents.push(students[i][0].trim() + " " + students[i][1].trim());
      }
    }
    if (eligibleStudents.length>0) {
      var rand = getRandomInt (0, (eligibleStudents.length-1));
      var student = eligibleStudents[rand];
    } else {
      var student = "No more students";
    }
    return student; 
  } else {
    return "No students in roster";
  }
}


function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


function startNewCol(e) {
  var app = UiApp.getActiveApplication();
  var newColButton = app.getElementById("newColButton");
  var button = app.getElementById("nextButton");
  var ssKey = UserProperties.getProperty('kidPicker_ssKey');
  var ss = SpreadsheetApp.openById(ssKey);
  var sheetName = e.parameter.sheetName;
  var sheet = ss.getSheetByName(sheetName);
  dateCompare(ss, sheet, "newCol");
  newColButton.setVisible(false);
  button.setVisible(true);
  refreshStudent(e);
  return app;
}


function dateCompare(ss, sheet, newCol) {
  var today = new Date();
  var timeZone = ss.getSpreadsheetTimeZone();
  var lastColRange = sheet.getRange(1, sheet.getLastColumn());
  var lastColDate = lastColRange.getValue();
  if (lastColDate.getMonth) {
    lastColDate = Utilities.formatDate(lastColDate, timeZone, "M/dd/yy");
  }
  var todayDate = Utilities.formatDate(today, timeZone, "M/dd/yy");
  if ((todayDate!=lastColDate)||(newCol=="newCol")) {
    sheet.getRange(1, sheet.getLastColumn()+1).setValue(todayDate);
  }
  return;
}


function refreshStudent(e) {
  var app = UiApp.getActiveApplication();
  var sheetName = e.parameter.sheetName;
  CacheService.getPrivateCache().put('sheetName', sheetName, '300');
  var ssKey = UserProperties.getProperty('kidPicker_ssKey');
  var ss = SpreadsheetApp.openById(ssKey);
  if (sheetName!="Select section") {
    var sheet = ss.getSheetByName(sheetName);
    dateCompare(ss, sheet);
    var studentName = fetchStudent(sheet);
  } else {
    var studentName = "";
  }
  var button = app.getElementById('nextButton');
  button.setEnabled(true);
  var newColButton = app.getElementById('newColButton');
  var buttonValues = getButtonValues(ssKey);
  var buttons = [];
  for (var i=0; i<buttonValues.length; i++) {
     buttons[i] = app.getElementById('button-'+i);
     if (studentName=="No more students") {
       buttons[i].setEnabled(false);
     }
     if (studentName=="No students in roster") {
       buttons[i].setEnabled(false);
     }
  }
  
 
  var absButton = app.getElementById('absButton');
  
  if (studentName=="No more students") {
    absButton.setEnabled(false);
    button.setEnabled(false);
    newColButton.setVisible(true).setEnabled(true);
  }
  
   if (studentName=="No students in roster") {
      absButton.setEnabled(false);
      newColButton.setVisible(false);
      button.setEnabled(false);
  }
  var student = app.getElementById('studentName');
  var hiddenStudent = app.getElementById('hiddenName');
  student.setText(studentName).setStyleAttribute('color', 'black').setStyleAttribute('opacity', '1');
  hiddenStudent.setValue(studentName);
  return app;
}
