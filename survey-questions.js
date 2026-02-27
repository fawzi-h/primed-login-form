/**
 *This Page `SurveyQuestions` renders a multi-step health
 *questionnaire form. The form includes various question types such as multiple-choice, date *input, text input, and textarea. The component handles the state of the form, saves the *user's progress, and validates the input. It also includes functionality to navigate through *the questions, submit the form, and handle conditional logic based on the user's answers.
 */
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { sanitizeInput } from "../Auth/Sanitizer";
import questionnaireDoneIllustration from "..//assets/images/questionnairedoneillustration.svg";
import "react-phone-input-2/lib/style.css";
import "flag-icon-css/css/flag-icons.min.css";
import "..//loadGoogleMaps";
import api from "../Api/AuthApi";
import locationIcon from "..//assets/images/location.png";
import usePlacesAutocomplete, { getGeocode } from "use-places-autocomplete";
import { X } from "lucide-react";
import getBaseUrl from "../Api/BaseUrl";
// import Questionairre from "../pages/Questionnaire"; // exact path
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import "@reach/combobox/styles.css";
// Define styles for the combobox options
const styles = {
  comboboxOption: {
    borderBottom: "1px solid #dee2e6",
    backgroundImage: `url(${locationIcon})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "10px center",
    padding: "10px 0 10px 40px",
  },
};

// Define the structure of the questionnaire
// const quiz = {
//   questions: [
//     {
//       key: "sex_at_birth",
//       question: "What was your sex at birth?",
//       choices: ["Male", "Female"],
//       type: "MCQs",
//     },
//     {
//       key: "pregnancy_status",
//       question:
//         "Are you currently pregnant or breastfeeding, or trying to fall pregnant?",
//       choices: ["Yes", "No"],
//       type: "MCQs",
//     },
//     {
//       key: "date_of_birth",
//       question: "What is your date of birth?",
//       type: "date_input",
//     },
//     {
//       key: "height",
//       question: "What is your height (in cm)?",
//       type: "input",
//       placeholder: "Enter Your Height",
//     },
//     {
//       key: "weight",
//       question: "What is your weight (in kg)?",
//       type: "weight_input",
//       placeholder: "Enter Your Weight",
//     },
//     {
//       key: "has_medical_conditions",
//       question: "Do you have any current or past medical conditions or injuries?",
//       choices: ["Yes", "No"],
//       type: "MCQs",
//     },
//     {
//       key: "medical_conditions_details",
//       question:
//         "Please give the prescriber more information about your medical conditions or injuries.",
//       type: "Textarea",
//       placeholder: "Explain Here",
//     },
//     {
//       key: "has_family_history",
//       question:
//         "Is there a history of any medical illness or disorder that has run within your family?",
//       choices: ["Yes", "No"],
//       type: "MCQs",
//     },
//     {
//       key: "family_history_details",
//       question:
//         "Please explain the medical illness that has run within your family.",
//       type: "Textarea",
//       placeholder: "Explain Here",
//     },
//     {
//       key: "taking_medications",
//       question: "Are you currently taking or have you ever taken any medications or supplements?",
//       choices: ["Yes", "No"],
//       type: "MCQs",
//     },
//     {
//       key: "medications_details",
//       question: "List all the medications or supplements.",
//       type: "Textarea",
//       placeholder: "(eg) Ibuprofen 200mg twice daily",
//       checkbox: true, // Checkbox flag
//     },
//     {
//       key: "has_allergies",
//       question: "Do you have any allergies?",
//       choices: ["Yes", "No"],
//       type: "MCQs",
//     },
//     {
//       key: "allergies_details",
//       question: "What allergies do you have?",
//       type: "Textarea",
//       placeholder: "Explain Here",
//     },
//     {
//       key: "has_additional_info",
//       question: "Anything else your doctor needs to consider?",
//       choices: ["Yes", "No"],
//       type: "MCQs",
//     },
//     {
//       key: "additional_info_details",
//       question: "Please explain this for your doctor.",
//       type: "Textarea",
//       placeholder: "Explain Here",
//     },
//     {
//       key: "medicare_number",
//       question: "What are your Medicare details?",
//       type: "input",
//       checkbox: true, // Checkbox flag
//       placeholder: "Enter Medicare Number",
//       image: true,
//     },
//     {
//       key: "individual_reference_number",
//       question: "What is your Individual Reference Number?",
//       type: "input",
//       checkbox: true, // Checkbox flag
//       image: true,
//       placeholder: "Enter Your IRN",
//     },
//     {
//       key: "referral_source",
//       question: "How did you hear about Primed?",
//       choices: [
//         "Word of mouth",
//         "Google/Bing",
//         "Instagram",
//         "Tiktok",
//         "Facebook",
//         "Reddit",
//         "Youtube",
//         "Newspaper / Magazine",
//         "Other",
//       ],
//       type: "MCQs",
//     },
//   ],
// };

// Key used to store and retrieve the questionnaire data in localStorage
const LOCAL_STORAGE_KEY = process.env.REACT_APP_SURVEY_LOCAL_STORAGE_KEY;
const isComingSoon = process.env.REACT_APP_COMING_SOON === 'true';
const SurveyQuestions = () => {
  // State variables to manage the form data and progress
  const [formLoading, setFormLoading] = useState(false);
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [answers, setAnswers] = useState({
    sex_at_birth: "",
    pregnancy_status: "",
    date_of_birth: "",
    height: "",
    weight: "",
    has_medical_conditions: "",
    medical_conditions_details: "",
    has_family_history: "",
    family_history_details: "",
    taking_medications: "",
    medications_details: "",
    has_allergies: "",
    allergies_details: "",
    has_additional_info: "",
    additional_info_details: "",
    medicare_number: "",
    medicare_expiry: "",
    individual_reference_number: "",
    referral_source: "",
  });
  const [questions, setQuestions] = useState([]); // questions fetched from API

  // Retrieve the current question index from localStorage
  const [currentQuestion, setCurrentQuestion] = useState(() => {
    const savedQuestion = localStorage.getItem(
      `${LOCAL_STORAGE_KEY}_currentQuestion`
    );
    return savedQuestion ? parseInt(savedQuestion, 10) : 0;
  });
  const [showAlert, setShowAlert] = useState(false);
     // eslint-disable-next-line
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(() => {
    // Retrieve the saved state from session storage
    const savedState = sessionStorage.getItem("sessionData");
    return savedState ? JSON.parse(savedState) : false;
  });
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [surveySaved, setSurveySaved] = useState(false);
  const [medicareCheckbox, setMedicareCheckbox] = useState(false);
  const [medicineCheckbox, setMedicineCheckbox] = useState(false);
  const [progress, setProgress] = useState(0);
  // const [treatmentName, setTreatmentName] = useState("");
  const [errors, setErrors] = useState({});
  const [backendError, setBackendError] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [referralCodeLocked, setReferralCodeLocked] = useState(false);
  const { id } = useParams();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "+61 ",
    address: "",
    password: "",
    confirmPassword: "",
    streetNumber: "",
    streetName: "",
    suburb: "",
    state: "",
    postcode: "",
    referral_code: "",
  });
  const [userId, setUserId] = useState(() => {
    // Attempt to retrieve sessionData from session storage
    const sessionData = sessionStorage.getItem("sessionData");

    // If sessionData exists, parse it and extract the userId
    if (sessionData) {
      const parsedData = JSON.parse(sessionData);
      return parsedData.userId || null;
    }

    // Return null if sessionData is not found
    return null;
  });
  const navigate = useNavigate();
  const location = useLocation();
  const showPopup = () => setIsVisible(true);
  const hidePopup = () => setIsVisible(false);
  const dropdownRef = useRef(null);

  // Map treatment names to imported images
  // const treatmentImages = {
  //   "Anti Ageing And Vitality": require("../assets/images/anti_ageing_vitality2.jpg"),
  //   "Weight Loss": require("../assets/images/weight_loss1.jpg"),
  //   "Muscle Strength And Support": require("../assets/images/muscle_strength_and_support.jpg"),
  //   "Injury Repair And Recovery": require("../assets/images/injury_repair_and_recovery.jpg"),
  //   "Sexual Health And Libido": require("../assets/images/libido_enhancement.jpg"),
  //   // "Sexual Health And Libido": require("../assets/images/sexual_health_and_libido.jpg"),
  //   "Hormone Therapy": require("../assets/images/hormone_therapy.jpg"),
  //   "Gut Health And Immunity": require("../assets/images/immunity.jpg"),
  //   "Cognitive Health": require("../assets/images/cognitive_enhancement.jpg"),
  //   "Skin Care": require("../assets/images/skin_care.jpg"),
    
  // };
// Fetch questionnaire from API
  useEffect(() => {
    let isMounted = true;

    const fetchQuestions = async () => {
      try {
        const response = await api.get("/api/initial-questionnaire", {
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });

        if (isMounted && Array.isArray(response.data)) {
          setQuestions(response.data);

          // Initialize answers only if not restored from localStorage
          setAnswers((prev) => {
            if (Object.keys(prev).length > 0) return prev;
            return response.data.reduce((acc, q) => {
              acc[q.key] = "";
              return acc;
            }, {});
          });
        }
      } catch (error) {
        console.error(error);
        navigate("/page/error");
      }
    };

    fetchQuestions();

    return () => {
      isMounted = false;
    };
  }, [navigate]);
// ---------------------- SAVE PROGRESS ----------------------
  useEffect(() => {
    if (token) {
      localStorage.setItem(
        `${LOCAL_STORAGE_KEY}_${token}`,
        JSON.stringify({
          answers,
          currentQuestion,
          timestamp: Date.now(),
        })
      );
    }
  }, [token, answers, currentQuestion]);

  // Only initialize Places Autocomplete when Google Maps is loaded
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    callbackName: "initMap",
    requestOptions: {
      types: ["address"],
      componentRestrictions: { country: "au" },
    },
    debounce: 300,
    //enabled: isLoaded, // Only enable when Google Maps is loaded
  });

  // Generate a unique token for the current session
  const generateToken = () => {
    return Math.random().toString(36).substring(2, 20);
  };

  // Determine if a question should be visible based on the user's previous answers
  const isQuestionVisible = (index) => {
    // Implement conditional logic to show/hide questions based on the user's responses
    if (index === 1 && answers.sex_at_birth === "Male") return false;
    if (index === 6 && answers.has_medical_conditions !== "Yes") return false;
    if (index === 8 && answers.has_family_history !== "Yes") return false;
    if (index === 10 && answers.taking_medications !== "Yes") return false;
    if (index === 12 && answers.has_allergies !== "Yes") return false;
    if (index === 14 && answers.has_additional_info !== "Yes") return false;
    return true;
  };
  function formatAustralianPhone(raw) {
    // Strip non-digits just in case
    const digits = raw.replace(/\D/g, '');

    if (!digits.startsWith('614') || digits.length < 11) {
      return raw; // fallback to raw if it's not a valid AU mobile
    }

    // Format: +61 4XX XXX XXX
    return `+61 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`;
  }

  // Initialize the token and restore any saved progress
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    let currentToken = params.get("token");
    const referralFromUrl = params.get("referral_code"); // extract referral code
    const firstName = params.get("first_name");
    const lastName = params.get("last_name");
    const email = params.get("email");
    const phone = formatAustralianPhone(params.get("phone") || '');

    if (!currentToken) {
      currentToken = generateToken();
      // Preserve referral_code in the URL if it exists
      const newParams = new URLSearchParams({ token: currentToken });
      if (referralFromUrl) newParams.set("referral_code", referralFromUrl);
      if (firstName) newParams.set("first_name", firstName);
      if (lastName) newParams.set("last_name", lastName);
      if (email) newParams.set("email", email);
      if (phone) newParams.set("phone", phone);
      navigate(`?${newParams.toString()}`, { replace: true });
    }

    setToken(currentToken);

    // If referral code exists in the URL, prefill & lock the input
    if (referralFromUrl) {
      setFormData((prev) => ({
        ...prev,
        referral_code: referralFromUrl,
        phone: phone || prev.phone || ''
      }));
      setReferralCodeLocked(true);
    }
    setFormData((prev) => ({
        ...prev,
        firstName: firstName || prev.firstName || '',
        lastName: lastName || prev.lastName || '',
        email: email || prev.email || '',
        phone: phone || prev.phone || ''
      }));
    const savedData = localStorage.getItem(
      `${LOCAL_STORAGE_KEY}_${currentToken}`
    );
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        const { answers: savedAnswers, currentQuestion } = parsedData;

        // Update state with saved answers and current question if available
        setAnswers((prevAnswers) => ({
          ...prevAnswers,
          ...savedAnswers, // Merge saved answers into the initial state
        }));
        setCurrentQuestion(currentQuestion || 0);
        setProgress(((currentQuestion + 1) / questions.length) * 100);
      } catch (error) {
        console.error("Error parsing saved quiz data:", error);
      }
    }
    // Extract the formatted treatment name from the URL
    // const getFormattedTreatmentName = () => {
    //   const path = window.location.pathname;
    //   const segments = path.split("/");
    //   const treatmentSlug = segments[2];
    //   const formattedTreatmentName = treatmentSlug
    //     .split("-")
    //     .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    //     .join(" ");
    //   return formattedTreatmentName;
    // };

    // setTreatmentName(getFormattedTreatmentName());
  }, [location, navigate, questions.length]);

  // Save the current progress to localStorage, associated with the user's token
  useEffect(() => {
    if (token) {
      localStorage.setItem(
        `${LOCAL_STORAGE_KEY}_${token}`,
        JSON.stringify({
          answers,
          currentQuestion,
          timestamp: Date.now(),
        })
      );
    }
  }, [token, answers, currentQuestion]);

  // Check the URL for the quiz status and update the state accordingly
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("quiz_status") === "done") {
      setSurveySubmitted(true);
    } else if (searchParams.get("quiz_status") === "stopped") {
      setShowAlert(true);
    } else if (searchParams.get("quiz_status") === "saved") {
      setSurveySaved(true);
    }
  }, [location.search]);

  // Cleanup useEffect to check expiration when component mounts
  useEffect(() => {
    if (token) {
      const storedData = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${token}`);
      if (storedData) {
        const { timestamp } = JSON.parse(storedData);
        const isExpired = Date.now() - timestamp > 8640000;

        if (isExpired) {
          // Remove expired data from local storage
          localStorage.removeItem(`${LOCAL_STORAGE_KEY}_${token}`);
        }
      }
    }
  }, [token]);

  useEffect(() => {
    // Function to get token from URL
    const getTokenFromUrl = () => {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("token");
    };

    const currentToken = getTokenFromUrl(); // Get token from the URL

    // Check if sessionData already exists in sessionStorage
    const savedData = sessionStorage.getItem("sessionData");

    if (!savedData) {
      // First time refresh: Save the session data if userId and token exist
      if (userId && currentToken) {
        const sessionData = {
          userId,
          formSubmitted,
          token: currentToken,
        };
        sessionStorage.setItem("sessionData", JSON.stringify(sessionData));
      }
    } else {
      // Session data exists
      const { userId: savedUserId, token: savedToken } = JSON.parse(savedData);

      if (savedToken === currentToken) {
        // The tokens match, continue with the session
        setUserId(savedUserId); // Ensure userId persists
      } else {
        // Token mismatch, remove session and redirect to form
        sessionStorage.removeItem("sessionData");
      }
    }

    // Check for token on second refresh
    const savedSessionData = sessionStorage.getItem("sessionData");
    if (savedSessionData) {
      const sessionData = JSON.parse(savedSessionData);
      if (sessionData.token !== currentToken) {
        sessionStorage.removeItem("sessionData"); // Remove session on mismatch
      }
    }
  }, [userId, formSubmitted]);

  // Clear session data when the user navigates to a new route
  useEffect(() => {
    return () => {
      sessionStorage.removeItem("sessionData");
    };
  }, [location]);

  // Update the formData state with the user's personal information input
  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "phone" ? value.replace(/\D/g, "") : value,
    }));
  };

  const isQuestionAnswered = (index) => {
  if (!questions || !questions[index]) return false;
  const question = questions[index];
  const answer = answers[question.key];
  // --- Medicare: skip validation for BOTH 15 and 17 when checkbox is checked ---
  // quick skip for both Q15 Q16 & Q17 when checkbox is checked
  if ((index === 15 || index === 16 || index === 17) && medicareCheckbox) {
    return true;
  }

  if (index === 15) {
    const a15 = answers[questions[15].key];
    const a16 = answers[questions[16].key];
    const a17 = answers[questions[17].key];

    return (
      a15 !== undefined &&
      a15 !== "" &&
      a16 instanceof Date && !isNaN(a16) &&
      a17 !== undefined &&
      a17 !== ""
    );
  }

    if (index === 10 && question.checkbox) {
      if (medicineCheckbox) {
        // Set the answer for the 'medications_details' question
        answers.medications_details =
          "I can't remember. I'll have these ready for the consultation.";
        return true;
      } else {
        console.log(answers.medications_details);
        return (
          answers.medications_details !== undefined &&
          answers.medications_details !== ""
        );
      }
    }

    // if (index === 1 && answers.sex_at_birth === "Male") {
    //   answers.pregnancy_status = "No";
    // }

    if (
      index === questions.findIndex((q) => q.question.includes("height"))
    ) {
      return (
        answer !== undefined &&
        answer !== "" &&
        parseFloat(answer) >= 100 &&
        parseFloat(answer) <= 251
      );
    }

    if (
      index === questions.findIndex((q) => q.question.includes("weight"))
    ) {
      return (
        answer !== undefined &&
        answer !== "" &&
        parseFloat(answer) >= 40 &&
        parseFloat(answer) <= 300
      );
    }

    return answer !== undefined && answer !== "";
  };

  // Validate the input for number-based fields
  const validateNumberInput = (value, fieldName) => {
    if (isNaN(value)) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [fieldName]: "Please enter only a number",
      }));
      return false;
    }
    if (fieldName === "medicare" && value.length > 10) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [fieldName]: "Medicare number should not exceed 10 digits",
      }));
      return false;
    }
    setErrors((prevErrors) => ({ ...prevErrors, [fieldName]: null }));
    return true;
  };

  // Validate the email input
  const isValidEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const handleChange = (e) => {
    let input = e.target.value;

    // Ensure the input always starts with +61
    if (!input.startsWith("+61 ")) {
      input = "+61 ";
    }

    // Extract the number part after "+61 "
    let numberPart = input.slice(4).replace(/[^0-9]/g, "");

    // If the number starts with 0, replace it with the following digit
    if (numberPart.startsWith("0") && numberPart.length > 1) {
      numberPart = numberPart[1] + numberPart.slice(2);
    }

    if (numberPart.length > 9) {
      numberPart = numberPart.slice(0, 9);
    }
    // Format the phone number to +61 444 444 444 as you type
    const formattedNumber =
      "+61 " + numberPart.replace(/(\d{3})(\d{3})(\d{3})?/, "$1 $2 $3").trim();
    setFormData((prevData) => ({
      ...prevData,
      phone: formattedNumber,
    }));
  };

  // Validate the user's personal information input
  const validateForm = () => {
    let formErrors = {};
    if (!formData.firstName) formErrors.firstName = "First name is required";
    if (!formData.lastName) formErrors.lastName = "Last name is required";
    if (!formData.email) {
      formErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      formErrors.email = "Invalid email address";
    }
    if (!formData.phone || formData.phone === "+61 ") {
      formErrors.phone = "Phone number is required";
    } else if (!formData.phone.startsWith("+61 4")) {
      formErrors.phone = "Phone number must start with '4' or '04'.";
    } else if (formData.phone.length < 12) {
      formErrors.phone = "Invalid Phone number";
    }
    if (!formData.address) formErrors.address = "Address is required";
    if (!formData.streetNumber)
      formErrors.streetNumber = "Street number is required";
    if (!formData.streetName) formErrors.streetName = "Street name is required";
    if (!formData.suburb) formErrors.suburb = "Suburb is required";
    if (!formData.state) formErrors.state = "State is required";
    if (!formData.postcode) formErrors.postcode = "Postcode is required";
    if (!formData.confirmPassword)
      formErrors.confirmPassword = "Password is required";

    if (!formData.password) {
      formErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      formErrors.password = "Password must be at least 8 characters long";
    }
    if (formData.password !== formData.confirmPassword) {
      formErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  // Handle the user's selection of an address from the autocomplete suggestions
  const handleAddressSelect = async (address) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      handlePersonalInfoChange({
        target: { name: "address", value: address },
      });

      // Extract address components from Google Maps API response
      const addressComponents = results[0].address_components;
      const findComponent = (type) =>
        addressComponents.find((comp) => comp.types.includes(type))
          ?.long_name || "";

      const fields = [
        { name: "streetNumber", component: "street_number" },
        { name: "streetName", component: "route" },
        { name: "state", component: "administrative_area_level_1" },
        { name: "suburb", component: "locality" },
        { name: "postcode", component: "postal_code" },
      ];

      fields.forEach((field) =>
        handlePersonalInfoChange({
          target: { name: field.name, value: findComponent(field.component) },
        })
      );

      setIsDropdownVisible(true);
    } catch (error) {
      navigate("/page/error");
    }
  };

  // Update the answers state with the user's response
  const handleAnswer = (Key, answer) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [Key]: answer,
    }));
  };

  // Handle the form submission, including validation and sending data to backend
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setFormLoading(true);
      try {
        // Send form data request with form data
        await api.get("/sanctum/csrf-cookie");

        // Send login request with email and password
        const response = await api.post("/api/register/guest", {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address,
          streetNumber: formData.streetNumber,
          streetName: formData.streetName,
          suburb: formData.suburb,
          state: formData.state,
          postcode: formData.postcode,
          referral_code: formData.referral_code,
        });

        setUserId(response.data.user_id);
        setFormSubmitted(true);
        // const tName = formData.treatmentName || treatmentName;
        // navigate(`/questionnaire/${tName}/${id}`);
      } catch (error) {
        if (error.response && error.response.status === 422) {
          let errorMessage = "An error occurred.";

          const emailError = error.response.data.errors.email?.[0];
          const phoneError = error.response.data.errors.phone?.[0];
          const referralError = error.response.data.errors.referral_code?.[0];
          // Handle 422 error (unprocessable content) - credentials error
          if (emailError && phoneError) {
            errorMessage = "Email and phone are already used.";
          } else if (emailError) {
            errorMessage = emailError + "Login to your account instead.";
          } else if (phoneError) {
            errorMessage = phoneError;
          } else if (referralError) {
            errorMessage = referralError;
          }

          setBackendError(errorMessage);
        } else {
          setBackendError("Server error. Please try again.");
          navigate("/page/error");
        }
      } finally {
        setFormLoading(false);
      }
    }
  };

  // Render the personal information form
  const renderPersonalInfoForm = () => {
    return (
      <div>
        <form className="personal-form-wrapper">
          <h3 className="personal-form-title">
            Where should we send your treatment plan?
          </h3>

          <div className="row mb-3">
            <div className="col">
              <div className="form-outline">
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className={`form-control ${
                    errors.firstName ? "is-invalid" : ""
                  }`}
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handlePersonalInfoChange}
                />
                {errors.firstName && (
                  <small className="text-danger">{errors.firstName}</small>
                )}
              </div>
            </div>
            <div className="col">
              <div className="form-outline">
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className={`form-control ${
                    errors.lastName ? "is-invalid" : ""
                  }`}
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handlePersonalInfoChange}
                />
                {errors.lastName && (
                  <small className="text-danger">{errors.lastName}</small>
                )}
              </div>
            </div>
          </div>

          <div className="form-outline mb-3">
            <input
              type="text"
              id="email"
              name="email"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              placeholder="Email"
              value={formData.email}
              onChange={handlePersonalInfoChange}
            />
            {errors.email && (
              <small className="text-danger">{errors.email}</small>
            )}
          </div>

          <div className="form-outline mb-3">
            {/* <PhoneInput
              country={"au"}
              className={`form-controls ${errors.phone ? "is-invalid" : ""}`}
              value={formData.phone}
              onChange={handleChange}
              onBlur={validatePhoneNumber} // Validate on blur
              preferredCountries={["au"]}
              disableDropdown={true}
              enableAreaCodes={false}
              inputProps={{
                name: "phone",
                required: true,
                autoFocus: false,
              }}
            /> */}
            <input
              id="phone"
              name="phone"
              type="text"
              className={`form-control ${errors.phone ? "is-invalid" : ""}`}
              value={formData.phone}
              onChange={handleChange}
              placeholder="+61 4XX XXX XXX"
            />
            {errors.phone && (
              <small className="text-danger">{errors.phone}</small>
            )}
          </div>

          <div className="form-outline">
            <Combobox onSelect={handleAddressSelect} className="mb-3">
              <ComboboxInput
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (!isDropdownVisible) setIsDropdownVisible(false);
                }}
                disabled={!ready}
                placeholder="Residential Address"
                className={`form-control ${errors.address ? "is-invalid" : ""}`}
              />
              <ComboboxPopover>
                {status === "OK" && (
                  <ComboboxList className="combobox-list">
                    {data.map(({ place_id, description }) => (
                      <ComboboxOption
                        key={place_id}
                        value={description}
                        className="combobox-option"
                        style={styles.comboboxOption}
                      />
                    ))}
                  </ComboboxList>
                )}
              </ComboboxPopover>
            </Combobox>
            {errors.address && (
              <small className="text-danger">{errors.address}</small>
            )}

            {/* Smooth Transition Dropdown */}
            <div
              style={{
                maxHeight: isDropdownVisible ? "500px" : "0",
                overflow: "hidden",
                transition: "max-height 0.4s ease",
              }}
              className="additional-address-fields"
            >
              <div className="row mb-3">
                <div className="col">
                  <div className="form-group">
                    <input
                      type="text"
                      name="streetNumber"
                      value={formData.streetNumber}
                      placeholder="Street Number"
                      onChange={handlePersonalInfoChange}
                      className={`form-control ${
                        errors.streetNumber ? "is-invalid" : ""
                      }`}
                    />
                    {errors.streetNumber && (
                      <small className="text-danger">
                        {errors.streetNumber}
                      </small>
                    )}
                  </div>
                </div>
                <div className="col">
                  {" "}
                  <div className="form-group">
                    <input
                      type="text"
                      name="streetName"
                      value={formData.streetName}
                      placeholder="Street Name"
                      onChange={handlePersonalInfoChange}
                      className={`form-control ${
                        errors.streetName ? "is-invalid" : ""
                      }`}
                    />
                    {errors.streetName && (
                      <small className="text-danger">{errors.streetName}</small>
                    )}
                  </div>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col">
                  <div className="form-group">
                    <input
                      type="text"
                      name="suburb"
                      value={formData.suburb}
                      placeholder="Suburb"
                      onChange={handlePersonalInfoChange}
                      className={`form-control ${
                        errors.suburb ? "is-invalid" : ""
                      }`}
                    />
                    {errors.suburb && (
                      <small className="text-danger">{errors.suburb}</small>
                    )}
                  </div>
                </div>
                <div className="col">
                  {" "}
                  <div className="form-group">
                    <input
                      type="text"
                      value={formData.state}
                      onChange={handlePersonalInfoChange}
                      name="state"
                      placeholder="State"
                      className={`form-control ${
                        errors.state ? "is-invalid" : ""
                      }`}
                    />
                    {errors.state && (
                      <small className="text-danger">{errors.state}</small>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group mb-3">
                <input
                  type="text"
                  value={formData.postcode}
                  onChange={handlePersonalInfoChange}
                  placeholder="Post Code"
                  name="postcode"
                  className={`form-control ${
                    errors.postcode ? "is-invalid" : ""
                  }`}
                />
                {errors.postcode && (
                  <small className="text-danger">{errors.postcode}</small>
                )}
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col">
              <div className="form-outline mb-3">
                <input
                  type="password"
                  id="password"
                  name="password"
                  className={`form-control ${
                    errors.password ? "is-invalid" : ""
                  }`}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handlePersonalInfoChange}
                />

                {errors.password && (
                  <small className="text-danger">{errors.password}</small>
                )}
              </div>
            </div>
            <div className="col">
              <div className="form-outline mb-3">
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`form-control ${
                    errors.confirmPassword ? "is-invalid" : ""
                  }`}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handlePersonalInfoChange}
                />

                {errors.confirmPassword && (
                  <small className="text-danger">
                    {errors.confirmPassword}
                  </small>
                )}
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col">
              <div className="form-outline mb-3">
               <input
                type="text"
                id="referral_code"
                name="referral_code"
                className={`form-control ${
                  errors.referral_code ? "is-invalid" : ""
                } ${referralCodeLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                placeholder="Referral code"
                value={formData.referral_code}
                onChange={handlePersonalInfoChange}
                disabled={referralCodeLocked}
              />

              {referralCodeLocked}

              {errors.referral_code && (
                <small className="text-danger">{errors.referral_code[0]}</small>
              )}

              </div>
            </div>
          </div>
          {backendError && (
            <div className="alert alert-danger">{backendError}</div>
          )}
          <button
            type="submit"
            className={`submitBtn w-100 ${
              surveyLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handleFormSubmit}
            disabled={formLoading}
          >
            {formLoading ? "Creating your account..." : "SUBMIT"}
          </button>
        </form>
        <div className="questionnaire-footer">
          <p>
            Already A Member?{" "}
            {isComingSoon ? (
            <Link
              to={`/coming-soon`}
              className="questionnaire-footer-btn"
            >
            Login
            </Link> ) : (
            <Link
              to="/users/login" className="questionnaire-footer-btn"
            >Login
            </Link>)}
            {/* <Link to="/users/login" className="questionnaire-footer-btn">
              Login
            </Link> */}
          </p>
        </div>
      </div>
    );
  };

  const renderQuestion = (question, index) => {
    if (index !== currentQuestion) return null;

    if (index === 15) {
      return (
        <div>
          {/* Render question at index 15 */}
          <div className="mb-3 form-outline px-2">
            <h4 className="card-question mt-5">
              {sanitizeInput(questions[15].question)}
            </h4>
            <input
              type="text"
              value={answers[questions[15].key] || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (validateNumberInput(value, "medicare")) {
                  handleAnswer(questions[15].key, value);
                }
              }}
              className="form-control border rounded px-2 py-2 w-full"
              placeholder={sanitizeInput(questions[15].placeholder)}
              disabled={medicareCheckbox}
            />
            {errors["question_15"] && (
              <small className="text-danger">{errors["question_15"]}</small>
            )}
            {questions[15].description && (
              <p className="text-sm text-gray-500 mt-1">
                {sanitizeInput(questions[15].description)}
              </p>
            )}
          </div>
          {/* Render question at index 16 */}
          <div className="mb-3 form-outline px-2">
            <h4 className="card-question mt-5">
              {sanitizeInput(questions[16].question)}
            </h4>
            <DatePicker
              selected={answers.medicare_expiry || null} 
              onChange={(date) => {
                if (date) {
                  // keep real Date in state (for validation & UI)
                  handleAnswer("medicare_expiry", date);

                  // separately save formatted string for DB
                } else {
                  handleAnswer("medicare_expiry", null);
                }
              }}
              dateFormat="MM/yyyy"
              showMonthYearPicker
              placeholderText="MM/YYYY"
              minDate={new Date()}
              className="form-control border rounded px-2 py-2 w-full"
              disabled={medicareCheckbox}
            />
            {errors["question_16"] && (
              <small className="text-danger">{errors["question_16"]}</small>
            )}
            {questions[16].description && (
              <p className="text-sm text-gray-500 mt-1">
                {sanitizeInput(questions[16].description)}
              </p>
            )}
          </div>
          {/* Render question at index 17 */}
          <div className="mb-4 form-outline px-2">
            <h4 className="card-question mt-5">
              {sanitizeInput(questions[17].question)}
            </h4>
            <input
              type="text"
              value={answers[questions[17].key] || ""}
              onChange={(e) => {
                const value = e.target.value;

                if (validateNumberInput(value, "question_17")) {
                  handleAnswer(questions[17].key, value);
                }
              }}
              className="form-control border rounded px-2 py-2 w-full"
              placeholder={sanitizeInput(questions[17].placeholder)}
              disabled={medicareCheckbox}
            />
            {errors["question_17"] && (
              <small className="text-danger">{errors["question_17"]}</small>
            )}
            {questions[17].description && (
              <p className="text-sm text-gray-500 mt-1">
                {sanitizeInput(questions[17].description)}
              </p>
            )}
          </div>
          {question.image && (
            <div className="mt-2">
              <img
                src={require("..//assets/images/IRN.png")}
                alt="IRN Description"
                width="210"
              />
            </div>
          )}
          {question.checkbox && (
            <div className="mt-2 px-2">
              <input
                type="checkbox"
                id={`checkbox-${index}`}
                className="mr-2 questionCheckbox"
                checked={medicareCheckbox}
                onChange={(e) => {
                const checked = e.target.checked;
                setMedicareCheckbox(checked);

                if (checked) {
                  setAnswers((prev) => ({
                    ...prev,
                    [questions[15].key]: "",
                    [questions[16].key]: "",
                    [questions[17].key]: "",
                  }));

                  setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors["question_15"];
                    delete newErrors["question_16"];
                    delete newErrors["question_17"];
                    return newErrors;
                  });
                }
              }}

              />
              <label htmlFor={`checkbox-${index}`} className="px-1">
                {/* TODO: Get this from the databasey */}
                I'll have these ready for the consultation.
              </label>
            </div>
          )}
        </div>
      );
    }

    // Skip rendering questions 16 & 17 since it's handled in MedicareQuestions
    if (index === 16 || index === 17) return setCurrentQuestion(18);

    switch (question.type) {
      case "MCQs":
        return (
          <div className="mb-4">
            <h4 className="card-question mt-5">
              {sanitizeInput(question.question)}
            </h4>
            <ul className="card-list">
              {question.choices.map((choice, choiceIndex) => (
                <li
                  key={choiceIndex}
                  onClick={() => handleAnswer(question.key, choice)} // Use question.key here
                  className={`cursor-pointer mb-2 px-4 py-2 rounded ${
                    answers[question.key] === choice
                      ? "bg-blue-500 selected-answer"
                      : "bg-gray-200"
                  }`}
                >
                  <div className="radioBtn"></div>
                  {sanitizeInput(choice)}
                </li>
              ))}
            </ul>
          </div>
        );

      case "date_input":
        const today = new Date();
        const maxDate = new Date(today.setFullYear(today.getFullYear() - 18))
          .toISOString()
          .split("T")[0];
        return (
          <div className="mb-4 form-outline">
            <h4 className="card-question mt-5">
              {sanitizeInput(question.question)}
            </h4>
            <input
              type="date"
              max={maxDate}
              value={answers[question.key] || ""}
              onChange={(e) => handleAnswer(question.key, e.target.value)} // Use question.key here
              className="form-control border rounded px-2 py-2"
            />
          </div>
        );

      case "input":
      case "weight_input":
        return (
          <div className="mb-4 form-outline">
            <h4 className="card-question mt-5">
              {sanitizeInput(question.question)}
            </h4>
            <input
              type="text"
              value={answers[question.key] || ""}
              onChange={(e) => {
                const value = e.target.value;
                if (
                  question.type === "weight_input" ||
                  question.question.includes("height")
                ) {
                  if (
                    validateNumberInput(value, `question_${index}`) &&
                    !isNaN(value)
                  ) {
                    handleAnswer(question.key, value);
                  }
                } else {
                  handleAnswer(question.key, value);
                }
              }}
              className="form-control border rounded px-2 py-2"
              placeholder={sanitizeInput(question.placeholder)}
            />
          </div>
        );

case "Textarea":
  return (
    <div className="mb-4 form-outline">
      <h4 className="card-question mt-5">
        {sanitizeInput(question.question)}
      </h4>
      <textarea
        value={answers[question.key] || ""}
        onChange={(e) => handleAnswer(question.key, e.target.value)}
        className="form-control border rounded px-2 py-2"
        placeholder={sanitizeInput(question.placeholder)}
        rows="5"
        cols="55"
        disabled={
          question.key === "medications_details" && medicineCheckbox
        }
        maxLength={1000}
      />
      {question.description && (
        <p className="text-sm text-gray-500 mt-1">
          {sanitizeInput(question.description)}
        </p>
      )}
      {question.checkbox && (
        <div className="mt-2 px-2">
          <input
            type="checkbox"
            id={`checkbox-${index}`}
            className="mr-2 questionCheckbox"
            checked={medicineCheckbox}
            onChange={(e) => setMedicineCheckbox(e.target.checked)}
          />
          <label htmlFor={`checkbox-${index}`} className="px-1">
            I can't remember. I'll have these ready for the consultation.
          </label>
        </div>
      )}
    </div>
  );


      default:
        return null;
    }
  };

  // Handle the final submission of the questionnaire
  const handleSubmit = async () => {
    setSurveyLoading(true);
    try {
      // Send form data and survey answers to the backend
      await api.post("/api/register/complete", {
        user_id: userId || sessionStorage.getItem("userId"),
        sex_at_birth: answers.sex_at_birth,
        pregnancy_status: answers.pregnancy_status,
        date_of_birth: answers.date_of_birth,
        height: answers.height,
        weight: answers.weight,
        has_medical_conditions: answers.has_medical_conditions,
        medical_conditions_details: answers.medical_conditions_details,
        has_family_history: answers.has_family_history,
        family_history_details: answers.family_history_details,
        taking_medications: answers.taking_medications,
        medications_details: answers.medications_details,
        has_allergies: answers.has_allergies,
        allergies_details: answers.allergies_details,
        has_additional_info: answers.has_additional_info,
        additional_info_details: answers.additional_info_details,
        medicare_number: answers.medicare_number,
        medicare_expiry: answers.medicare_expiry 
          ? format(answers.medicare_expiry, "yyyy-MM")
          : null,
        individual_reference_number: answers.individual_reference_number,
        referral_source: answers.referral_source,
        treatment_id: id,
        is_completed: true,
      });

      const searchParams = new URLSearchParams(location.search);
      // Add or update the quiz_status parameter
      searchParams.set("quiz_status", "done");

      setSurveySubmitted(true);
      // Navigate to the new URL with the updated query parameters
      navigate(`${location.pathname}?${searchParams.toString()}`);
      sessionStorage.clear();
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_${token}`);
    } catch (error) {
      navigate("/page/error");
    } finally {
      setSurveyLoading(false);
    }
  };

  const handleSave = async () => {
    setSurveyLoading(true);

    try {
      // Send form data and survey answers to the backend
      await api.post("/api/register/complete", {
        user_id: userId,
        sex_at_birth: answers.sex_at_birth,
        pregnancy_status: answers.pregnancy_status,
        date_of_birth: answers.date_of_birth,
        height: answers.height,
        weight: answers.weight,
        has_medical_conditions: answers.has_medical_conditions,
        medical_conditions_details: answers.medical_conditions_details,
        has_family_history: answers.has_family_history,
        family_history_details: answers.family_history_details,
        taking_medications: answers.taking_medications,
        medications_details: answers.medications_details,
        has_allergies: answers.has_allergies,
        allergies_details: answers.allergies_details,
        has_additional_info: answers.has_additional_info,
        additional_info_details: answers.additional_info_details,
        medicare_number: answers.medicare_number,
        medicare_expiry: answers.medicare_expiry 
          ? format(answers.medicare_expiry, "yyyy-MM-01")
          : null, // <-- fixed

        individual_reference_number: answers.individual_reference_number,
        referral_source: answers.referral_source,
        treatment_id: id,
        is_completed: false,
      });

      const searchParams = new URLSearchParams(location.search);

      setSurveySaved(true);

      // Add or update the quiz_status parameter
      searchParams.set("quiz_status", "saved");

      // Navigate to the new URL with the updated query parameters
      navigate(`${location.pathname}?${searchParams.toString()}`);
      sessionStorage.clear();
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}_${token}`);
    } catch (error) {
      navigate("/page/error");
    } finally {
      setSurveyLoading(false);
    }
  };

  const handleContinue = () => {
    // if (currentQuestion === 16 || currentQuestion === 17) {
    //   setCurrentQuestion(18);
    //   return;
    // }
    hidePopup();
  };

  const sendStoppedQuestionnaireData = async () => {
    try {
      await api.post("/api/register/complete", {
        user_id: userId,
        sex_at_birth: answers.sex_at_birth,
        pregnancy_status: answers.pregnancy_status,
        date_of_birth: answers.date_of_birth,
        height: answers.height,
        weight: answers.weight,
        has_medical_conditions: answers.has_medical_conditions,
        medical_conditions_details: answers.medical_conditions_details,
        has_family_history: answers.has_family_history,
        family_history_details: answers.family_history_details,
        taking_medications: answers.taking_medications,
        medications_details: answers.medications_details,
        has_allergies: answers.has_allergies,
        allergies_details: answers.allergies_details,
        has_additional_info: answers.has_additional_info,
        additional_info_details: answers.additional_info_details,
        medicare_number: answers.medicare_number,
        medicare_expiry: answers.medicare_expiry 
          ? format(answers.medicare_expiry, "yyyy-MM-01")
          : null,
        individual_reference_number: answers.individual_reference_number,
        referral_source: answers.referral_source,
        treatment_id: id,
        is_completed: false,
      });
    } catch (error) {
      navigate("/page/error");
    }
  };

  // Navigate to the next question, handling conditional logic
  const handleNext = () => {
    const medicareKeys = ["medicare_number", "individual_reference_number"];
    if (medicareKeys.includes(questions[currentQuestion].key) && !medicareCheckbox) {
      const a15 = (answers.medicare_number || "").trim();
      const a17 = (answers.individual_reference_number || "").trim();

      let hasError = false;

      if (!a15) {
        setErrors((prev) => ({ ...prev, question_15: "Medicare number is required" }));
        hasError = true;
      } else if (!/^\d{10}$/.test(a15)) {
        setErrors((prev) => ({ ...prev, question_15: "Medicare number must be 10 digits" }));
        hasError = true;
      }

      if (!a17) {
        setErrors((prev) => ({ ...prev, question_17: "Individual Reference Number is required" }));
        hasError = true;
      }

      if (hasError) return; // stop navigation
    }
    // if (questions[currentQuestion].key === "medicare_number") {
    //       const value = (answers.medicare_number || "").trim();
    //       if (!/^\d{10}$/.test(value)) {
    //     setErrors((prev) => ({
    //       ...prev,
    //       question_15: "Medicare number must be 10 digits",
    //     }));
    //     return; // stop navigation
    //   }
    //   }

      let nextIndex = currentQuestion + 1;

      if (currentQuestion === 1 && answers.pregnancy_status === "Yes") {
          sendStoppedQuestionnaireData();

          setShowAlert(true);
          const searchParams = new URLSearchParams(location.search);
          searchParams.set("quiz_status", "stopped");
          navigate(`${location.pathname}?${searchParams.toString()}`);
      }

      while (nextIndex < questions.length && !isQuestionVisible(nextIndex)) {
          nextIndex++;
      }

      if (nextIndex < questions.length) {
          setCurrentQuestion(nextIndex);
          setProgress(((nextIndex + 1) / questions.length) * 100);
      }
  };


  // Navigate to the previous question
  const handlePrevious = () => {
    let prevIndex = currentQuestion - 1;

    while (prevIndex >= 0 && !isQuestionVisible(prevIndex)) {
      prevIndex--;
    }
    if (prevIndex >= 0) {
      setCurrentQuestion(prevIndex);
      setProgress(((prevIndex + 1) / questions.length) * 100);
    }

    if (currentQuestion === 18) {
      setCurrentQuestion(prevIndex - 2);
    }
  };

  // Render the "Thank You" screen
  if (surveySubmitted) {
    return (
      <div className="questionnaire-wrapper">
        <div className="container">
          <Link to="/">
            <div className="questionnaire-header">
              <img
                src={require("../assets/images/primedclinic-logo-white.png")}
                alt="Logo"
              />
            </div>
          </Link>

          <div className="questionnaire-container">
            <div className="questionnaire-card">
              <div className="card-header mb-4">
                <img
                  src={questionnaireDoneIllustration}
                  alt="Illustration"
                  width={"125px"}
                />
              </div>
              <div className="card-body">
                <h3 className="questionnaire-title">
                  That's it! You're all done.
                </h3>
                <p className="questionnaire-description">
                  Thank you for completing the questionnaire. We look forward to discussing your {" "}
                  health journey in your upcoming consultation
                  {/* Thank you for filling the questionnaire. Login to your account
                  to book a call with one of our experts for your{" "}
                  {treatmentName} telehealth assessment. */}
                </p>
                <p className="questionnaire-notice">
                  After the appointment, your practitioner will be in touch to
                  recommend a tailored treatment plan.
                </p>
                <a href={`${getBaseUrl()}/patient`}>
                  <button className="questionairre-startBtn">
                    Login To Your Dashboard
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (surveySaved) {
    return (
      <div className="questionnaire-wrapper">
        <div className="container">
          <Link to="/">
            <div className="questionnaire-header">
              <img
                src={require("../assets/images/primedclinic-logo-white.png")}
                alt="Logo"
              />
            </div>
          </Link>

          <div className="questionnaire-container">
            <div className="questionnaire-card">
              <div className="card-body">
                <h3 className="questionnaire-title">Your Progress Is Saved!</h3>
                <p className="questionnaire-description">
                  Login anytime to your account to continue your questionnaire
                  for the telehealth assessment from where you
                  stopped!
                </p>
                <p className="questionnaire-notice">
                  After finishing your questionnaire, your practitioner will be
                  in touch to recommend a tailored treatment plan.
                </p>
                <a href={`${getBaseUrl()}/patient`}>
                  <button className="questionairre-startBtn">
                    Login To Your Dashboard
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stop quiz and render the pregnancy-related alert screen
  if (showAlert) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_${token}`);
    sessionStorage.clear();

    return (
      <div className="questionnaire-wrapper">
        <div className="container">
          <Link to="/">
            <div className="questionnaire-header">
              <img
                src={require("../assets/images/primedclinic-logo-white.png")}
                alt="Logo"
              />
            </div>
          </Link>
          <div className="questionnaire-container">
            <div className="questionnaire-card">
              <div className="card-body">
                <h3 className="questionnaire-title">
                  We're sorry, but Primed Clinic is not the right fit for you at this
                  time.
                </h3>
                <p className="questionnaire-description survey-questionnaire-description">
                  Primed Clinic is not suitable for pregnant women, those
                  breastfeeding or planning to become pregnant. Some of the
                  treatments available through Primed Clinic could complicate your
                  pregnancy journey. Please get in touch with your GP, who can
                  offer more suitable options.
                </p>
                <Link to="/">
                  <button className="questionairre-startBtn">
                    Return To Home Page
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={showQuestionnaire ? "" : "survey-questions"}>
      {/* {!showQuestionnaire && ( */}
      <div className="survey-header">
        <div className="container">
          <div className="d-flex">
            {formSubmitted && (
              <div className="popup-preview" ref={dropdownRef}>
                <button
                  onClick={showPopup}
                  className="signout_button transition-colors duration-200"
                  aria-label="Menu"
                >
                  <img
                    src={require("..//assets/images/signoutIcon.png")}
                    alt="Sign out icon"
                    className="signout_img"
                  />
                </button>

                {isVisible && (
                  <div className="popup-overlay">
                    <div className="popup-container">
                      <button onClick={hidePopup} className="close-button">
                        <X size={20} />
                      </button>

                      <div className="popup-content">
                        <h2 className="popup-title">Save your progress?</h2>
                        <p className="popup-description">
                          Save your progress with us and login later to your
                          dashboard to continue your questionnaire!
                        </p>

                        <div className="popup-buttons">
                          <button
                            onClick={handleSave}
                            className={`create-account-button ${
                              answers.sex_at_birth === "" || surveyLoading
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            disabled={answers.sex_at_birth === "" || surveyLoading}
                          >
                            {surveyLoading
                              ? "Saving your progress..."
                              : "Save Your Progress"}
                          </button>

                          <button
                            onClick={handleContinue}
                            className="continue-button"
                          >
                            Continue quiz
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="m-auto">
              <Link to="/">
                <img
                  src={require("../assets/images/primedclinic-logo.png")}
                  alt="Logo"
                  className="survey-header-logo"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* )} */}

      {!formSubmitted ? (
        renderPersonalInfoForm()
      ) : (
        <>
          <div className="survey-progress-bar">
            <div
              className="survey-progress-bar-line"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="survey-card container-fluid">
            <div className="card-content">
              {questions.map((question, index) =>
                renderQuestion(question, index)
              )}
              <div className="card-bottom flex-right">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="cardBtn prevBtn disabled:opacity-50"
                >
                  <img
                    src={require("..//assets/images/questionairreBackButton.png")}
                    alt="Back Button"
                  />
                </button>
                {currentQuestion < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    disabled={!isQuestionAnswered(currentQuestion)}
                    className="cardBtn nextBtn disabled:opacity-50"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={
                      !isQuestionAnswered(currentQuestion) || surveyLoading
                    }
                    className={`cardBtn submitQuizBtn rounded ${
                      !isQuestionAnswered(currentQuestion) || surveyLoading
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {surveyLoading ? "Submitting..." : "Submit"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SurveyQuestions;
