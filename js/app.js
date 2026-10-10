// Get the PDF upload input and message area
const pdfUpload = document.getElementById("pdf-upload");
const uploadMessage = document.getElementById("upload-message");

// Set up the PDF.js worker
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

// Handle PDF uploads
if (pdfUpload && uploadMessage) {
  pdfUpload.addEventListener("change", async function () {
    const file = pdfUpload.files[0];

    if (!file) {
      uploadMessage.textContent = "Please choose a PDF file.";
      return;
    }

    // Check that the file is a PDF
    const isPDF =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPDF) {
      uploadMessage.textContent = "Please choose a PDF file.";
      pdfUpload.value = "";
      return;
    }

    // Check that PDF.js has loaded
    if (!window.pdfjsLib) {
      uploadMessage.textContent =
        "PDF reader failed to load. Check your internet connection and refresh.";
      return;
    }

    // Limit the file size to 20 MB
    if (file.size > 20 * 1024 * 1024) {
      uploadMessage.textContent =
        "This file is too large. Please choose a PDF under 20 MB.";
      pdfUpload.value = "";
      return;
    }

    uploadMessage.textContent = "Reading your PDF...";

    try {
      const fileData = await file.arrayBuffer();

      const pdf = await pdfjsLib.getDocument({
        data: fileData
      }).promise;

      let extractedText = "";

      // Extract text from each page
      for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
      ) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
          .map(function (item) {
            return item.str || "";
          })
          .join(" ");

        extractedText += pageText + "\n";
      }

      // Remove extra spaces
      extractedText = extractedText
        .replace(/\s+/g, " ")
        .trim();

      // Check whether the PDF contains readable text
      if (extractedText.length < 50) {
        sessionStorage.removeItem("studysmartPdfText");
        sessionStorage.removeItem("studysmartPdfName");

        uploadMessage.textContent =
          "We couldn't find enough selectable text. This PDF may be scanned. OCR support is our next step.";

        return;
      }

      // Save the extracted text and file name
      sessionStorage.setItem(
        "studysmartPdfText",
        extractedText
      );

      sessionStorage.setItem(
        "studysmartPdfName",
        file.name
      );

      uploadMessage.textContent =
        "PDF read successfully! " +
        pdf.numPages +
        " page(s) processed. Your notes are ready.";

    } catch (error) {
      console.error("PDF reading error:", error);

      sessionStorage.removeItem("studysmartPdfText");
      sessionStorage.removeItem("studysmartPdfName");

      uploadMessage.textContent =
        "We couldn't read this PDF. Please try another file.";
    }
  });
}

// Get the flashcard element
const flashcard = document.getElementById("flashcard");

if (flashcard) {
  const pdfText = sessionStorage.getItem("studysmartPdfText");
  let cards = [];

  // Generate flashcards from the uploaded PDF
  if (pdfText) {
    const text = pdfText.toLowerCase();

    // Recognise Lesson 1
    if (
      text.includes("dynamic web content") &&
      text.includes("hypertext markup language")
    ) {
      cards = [
        {
          question: "What does HTML stand for?",
          answer: "Hypertext Markup Language."
        },
        {
          question: "What is HTTP?",
          answer: "HTTP is a communication standard governing requests and responses between a web browser and a web server."
        },
        {
          question: "What is the role of a web server?",
          answer: "A web server receives requests from clients and attempts to respond meaningfully, usually by serving a requested webpage."
        },
        {
          question: "What is the purpose of DNS?",
          answer: "The Domain Name Service (DNS) helps the browser find the IP address associated with a server's domain name."
        },
        {
          question: "What are the main steps in the basic request/response procedure?",
          answer: "The browser looks up the server's IP address, requests a webpage, the server receives the request, retrieves the page, returns it, and the browser displays it."
        },
        {
          question: "How does PHP contribute to dynamic webpages?",
          answer: "PHP executes server-side code and can use SQL to request information from a database before the server returns the resulting webpage."
        },
        {
          question: "What is MySQL used for?",
          answer: "MySQL is a database management system used to store, retrieve, and manage data."
        },
        {
          question: "What is the main purpose of JavaScript?",
          answer: "JavaScript enables interaction with HTML elements and helps webpages update dynamically in response to user actions."
        },
        {
          question: "What is CSS used for?",
          answer: "CSS controls webpage presentation, including layout, colours, dimensions, borders, spacing, and animations."
        },
        {
          question: "Name three media elements introduced in HTML5.",
          answer: "The audio, video, and canvas elements."
        },
        {
          question: "What is Apache?",
          answer: "Apache is a web server that serves webpages and other resources, and can handle files generated by programs such as PHP."
        },
        {
          question: "What is asynchronous communication?",
          answer: "It allows a webpage to exchange data with a web server in the background and update particular content without reloading the entire page."
        },
        {
          question: "What is MariaDB?",
          answer: "MariaDB is a database system forked from MySQL to maintain a free, open-source alternative. It retains close compatibility with MySQL."
        },
        {
          question: "What is the role of SQL in database operations?",
          answer: "SQL is a language used to query and manage database information, including inserting and retrieving records."
        },
        {
          question: "How do PHP, MySQL, JavaScript, CSS, and HTML work together?",
          answer: "PHP handles server-side processing, MySQL manages data, HTML structures webpage content, CSS controls presentation, and JavaScript supports interaction and dynamic updates."
        }
      ];
    } else {
      // Find simple definition sentences in other PDFs
      const sentences = pdfText.match(/[^.!?]+[.!?]+/g) || [];

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim();

        const match = sentence.match(
          /^(.{2,70}?)\s+(?:is defined as|is known as|refers to|is)\s+(.{15,220})[.!?]?$/i
        );

        if (match) {
          const term = match[1].trim();

          cards.push({
            question: "What is " + term + "?",
            answer: sentence
          });
        }

        if (cards.length >= 10) {
          break;
        }
      }
    }
  }

  // Handle PDFs without suitable flashcards
  if (cards.length === 0) {
    cards.push({
      question: "No suitable flashcards found",
      answer: "Return to the homepage and upload a PDF with readable text and recognisable definitions."
    });
  }

  // Get the flashcard elements
  let currentCard = 0;
  let answerVisible = false;

  const cardCounter = document.getElementById("card-counter");
  const cardLabel = document.getElementById("card-label");
  const cardContent = document.getElementById("card-content");
  const cardHint = document.getElementById("card-hint");
  const revealButton = document.getElementById("reveal-button");
  const previousButton = document.getElementById("previous-button");
  const nextButton = document.getElementById("next-button");

  // Display the current flashcard
  function displayCard() {
    const card = cards[currentCard];

    cardCounter.textContent =
      "Card " + (currentCard + 1) + " of " + cards.length;

    cardLabel.textContent = answerVisible ? "ANSWER" : "QUESTION";

    cardContent.textContent = answerVisible
      ? card.answer
      : card.question;

    cardHint.textContent = answerVisible
      ? "Take your time to understand the answer."
      : "Think about it before revealing the answer.";

    revealButton.textContent = answerVisible
      ? "Show Question"
      : "Reveal Answer";

    previousButton.disabled = currentCard === 0;
    nextButton.disabled = currentCard === cards.length - 1;
  }

  // Reveal or hide the answer
  revealButton.addEventListener("click", function () {
    answerVisible = !answerVisible;
    displayCard();
  });

  // Move to the previous card
  previousButton.addEventListener("click", function () {
    if (currentCard > 0) {
      currentCard--;
      answerVisible = false;
      displayCard();
    }
  });

  // Move to the next card
  nextButton.addEventListener("click", function () {
    if (currentCard < cards.length - 1) {
      currentCard++;
      answerVisible = false;
      displayCard();
    }
  });

  // Show the first card
  displayCard();
}

// Get the quiz container
const quizContent = document.getElementById("quiz-content");

if (quizContent) {
  // Store the quiz questions
  const questions = [
    {
      question: "What does HTML stand for?",
      options: [
        "Hypertext Markup Language",
        "High Transfer Machine Language",
        "Hyperlink Text Management Language",
        "Home Tool Markup Language"
      ],
      answer: 0
    },
    {
      question: "What is the main purpose of HTTP?",
      options: [
        "To style webpages",
        "To govern requests and responses between browsers and servers",
        "To store data in tables",
        "To create animations"
      ],
      answer: 1
    },
    {
      question: "What does DNS help a browser find?",
      options: [
        "The webpage's colour",
        "The user's password",
        "The server's IP address",
        "The webpage's font"
      ],
      answer: 2
    },
    {
      question: "Which technology mainly handles server-side processing?",
      options: [
        "CSS",
        "HTML",
        "JavaScript",
        "PHP"
      ],
      answer: 3
    },
    {
      question: "What is MySQL used for?",
      options: [
        "Managing databases",
        "Styling webpage layouts",
        "Displaying images only",
        "Replacing HTML"
      ],
      answer: 0
    },
    {
      question: "What is a major role of JavaScript on a webpage?",
      options: [
        "Physically connecting computers",
        "Adding dynamic interaction to webpage elements",
        "Replacing the web server",
        "Managing the computer's operating system"
      ],
      answer: 1
    },
    {
      question: "Which three elements are highlighted for media in HTML5?",
      options: [
        "Table, form, and heading",
        "Header, footer, and paragraph",
        "Audio, video, and canvas",
        "Image, link, and title"
      ],
      answer: 2
    },
    {
      question: "What is asynchronous communication?",
      options: [
        "Reloading every webpage after every click",
        "Printing a webpage",
        "Changing CSS manually",
        "Exchanging data in the background without reloading the entire page"
      ],
      answer: 3
    }
  ];

  let currentQuestion = 0;
  let score = 0;
  let selectedAnswer = null;
  let answerChecked = false;

  // Get the quiz elements
  const questionCounter = document.getElementById("question-counter");
  const scoreDisplay = document.getElementById("score-display");
  const progressBar = document.getElementById("progress-bar");
  const questionText = document.getElementById("question-text");
  const answerOptions = document.getElementById("answer-options");
  const feedbackMessage = document.getElementById("feedback-message");
  const submitButton = document.getElementById("submit-button");
  const nextButton = document.getElementById("next-question-button");

  // Display the current question
  function displayQuestion() {
    const question = questions[currentQuestion];

    questionCounter.textContent =
      "Question " + (currentQuestion + 1) +
      " of " + questions.length;

    scoreDisplay.textContent = "Score: " + score;

    progressBar.style.width =
      ((currentQuestion + 1) / questions.length * 100) + "%";

    questionText.textContent = question.question;
    answerOptions.textContent = "";
    feedbackMessage.textContent = "";
    feedbackMessage.className = "";

    selectedAnswer = null;
    answerChecked = false;

    submitButton.hidden = false;
    submitButton.disabled = true;
    nextButton.hidden = true;

    // Display the answer options
    question.options.forEach(function (option, index) {
      const label = document.createElement("label");
      label.className = "answer-option";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "quiz-answer";
      radio.value = index;

      const optionText = document.createElement("span");
      optionText.textContent = option;

      // Record the selected answer
      radio.addEventListener("change", function () {
        if (!answerChecked) {
          selectedAnswer = index;
          submitButton.disabled = false;

          document.querySelectorAll(".answer-option")
            .forEach(function (item) {
              item.classList.remove("selected");
            });

          label.classList.add("selected");
        }
      });

      label.appendChild(radio);
      label.appendChild(optionText);
      answerOptions.appendChild(label);
    });
  }

  // Check the selected answer
  submitButton.addEventListener("click", function () {
    if (selectedAnswer === null || answerChecked) {
      return;
    }

    answerChecked = true;

    const correctAnswer = questions[currentQuestion].answer;
    const optionLabels =
      answerOptions.querySelectorAll(".answer-option");

    optionLabels.forEach(function (label, index) {
      const radio = label.querySelector("input");
      radio.disabled = true;

      if (index === correctAnswer) {
        label.classList.add("correct");
      }

      if (
        index === selectedAnswer &&
        selectedAnswer !== correctAnswer
      ) {
        label.classList.add("incorrect");
      }
    });

    // Display feedback
    if (selectedAnswer === correctAnswer) {
      score++;
      feedbackMessage.textContent = "Correct! Well done!";
      feedbackMessage.className = "correct-feedback";
    } else {
      feedbackMessage.textContent =
        "Not quite. The correct answer is: " +
        questions[currentQuestion].options[correctAnswer];

      feedbackMessage.className = "incorrect-feedback";
    }

    scoreDisplay.textContent = "Score: " + score;

    submitButton.hidden = true;
    nextButton.hidden = false;

    nextButton.textContent =
      currentQuestion === questions.length - 1
        ? "View Results"
        : "Next Question";
  });

  // Move to the next question
  nextButton.addEventListener("click", function () {
    if (!answerChecked) {
      return;
    }

    currentQuestion++;

    if (currentQuestion < questions.length) {
      displayQuestion();
    } else {
      showResults();
    }
  });
}

// Get the quiz results elements
const quizResults = document.getElementById("quiz-results");
const finalScore = document.getElementById("final-score");
const resultMessage = document.getElementById("result-message");
const restartButton = document.getElementById("restart-button");

// Show the final results
function showResults() {
  questionText.hidden = true;
  answerOptions.hidden = true;
  questionCounter.hidden = true;
  progressBar.parentElement.hidden = true;
  feedbackMessage.hidden = true;
  submitButton.hidden = true;
  nextButton.hidden = true;

  quizResults.hidden = false;

  finalScore.textContent =
    "Your score: " + score + " out of " + questions.length;

  const percentage = Math.round(
    (score / questions.length) * 100
  );

  resultMessage.textContent = "You scored " + percentage + "%.";

  if (percentage >= 80) {
    resultMessage.textContent += " Excellent work! Keep it up.";
  } else if (percentage >= 50) {
    resultMessage.textContent +=
      " Good effort! Review the lesson and try again.";
  } else {
    resultMessage.textContent +=
      " Keep practising. You can improve with revision.";
  }

  // Save the latest quiz result
  localStorage.setItem(
    "studysmartLatestQuiz",
    JSON.stringify({
      score: score,
      total: questions.length,
      percentage: percentage,
      date: new Date().toLocaleDateString()
    })
  );
}

// Restart the quiz
restartButton.addEventListener("click", function () {
  currentQuestion = 0;
  score = 0;
  selectedAnswer = null;
  answerChecked = false;

  questionText.hidden = false;
  answerOptions.hidden = false;
  questionCounter.hidden = false;
  progressBar.parentElement.hidden = false;
  feedbackMessage.hidden = false;
  quizResults.hidden = true;

  displayQuestion();
});

// Start the quiz when the page loads
quizContent.hidden = false;
quizResults.hidden = true;
displayQuestion();
