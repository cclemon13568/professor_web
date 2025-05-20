-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- 主機： localhost:3306
-- 產生時間： 2025 年 05 月 19 日 10:06
-- 伺服器版本： 10.11.11-MariaDB-0ubuntu0.24.04.2
-- PHP 版本： 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 資料庫： `database`
--

-- --------------------------------------------------------

--
-- 資料表結構 `appointment_info`
--

CREATE TABLE `appointment_info` (
  `appointment_ID` char(15) NOT NULL,
  `office_location` varchar(25) DEFAULT NULL,
  `appoint_Date` datetime DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  `student_ID` char(10) DEFAULT NULL,
  `student_Name` varchar(20) DEFAULT NULL,
  `course_ID` char(15) DEFAULT NULL,
  `problem_description` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `appointment_mapping`
--

CREATE TABLE `appointment_mapping` (
  `teacher_ID` char(15) NOT NULL,
  `appointment_ID` char(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `campus_experience`
--

CREATE TABLE `campus_experience` (
  `teacher_ID` char(15) NOT NULL,
  `experience` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `campus_experience`
--

INSERT INTO `campus_experience` (`teacher_ID`, `experience`) VALUES
('T002', '校務企劃組 組長'),
('T002', '系統維運組 組長'),
('T002', '資源管理中心 主任'),
('T002', '資訊工程學系 副教授'),
('T002', '資訊工程學系 助理教授'),
('T002', '資訊工程學系 教授'),
('T002', '資訊工程學系 特聘教授'),
('T002', '資訊工程學系 系主任'),
('T002', '資訊教學中心 主任'),
('T002', '資通安全研究中心 主任'),
('T002', '資通安全研究中心 副主任'),
('T002', '逢甲大學帆宣智慧城市5G實驗室 研究員');

-- --------------------------------------------------------

--
-- 資料表結構 `course_info`
--

CREATE TABLE `course_info` (
  `course_ID` char(15) NOT NULL,
  `course_name` varchar(25) DEFAULT NULL,
  `course_time` varchar(25) DEFAULT NULL,
  `course_outline` varchar(300) DEFAULT NULL,
  `teacher_ID` char(15) DEFAULT NULL,
  `course_score` varchar(300) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `evaluation`
--

CREATE TABLE `evaluation` (
  `evaluate_ID` char(15) NOT NULL,
  `student_ID` char(15) DEFAULT NULL,
  `course_period` int(11) DEFAULT NULL,
  `evaluate` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `evaluation_mapping`
--

CREATE TABLE `evaluation_mapping` (
  `course_ID` char(15) NOT NULL,
  `evaluate_ID` char(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `external_experience`
--

CREATE TABLE `external_experience` (
  `teacher_ID` char(15) NOT NULL,
  `experience` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `login_info`
--

CREATE TABLE `login_info` (
  `professor_accoutnumber` char(15) NOT NULL,
  `professor_password` varchar(50) DEFAULT NULL,
  `verification_code` char(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `message_board`
--

CREATE TABLE `message_board` (
  `question_ID` char(15) NOT NULL,
  `question_name` varchar(20) DEFAULT NULL,
  `question_department` varchar(50) DEFAULT NULL,
  `question` text DEFAULT NULL,
  `popular_question` text DEFAULT NULL,
  `respond` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `paper_info`
--

CREATE TABLE `paper_info` (
  `paper_ID` char(15) NOT NULL,
  `paper_topic` varchar(500) DEFAULT NULL,
  `paper_authors` varchar(1000) DEFAULT NULL,
  `paper_year` varchar(50) DEFAULT NULL,
  `paper_link` varchar(300) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `paper_info`
--

INSERT INTO `paper_info` (`paper_ID`, `paper_topic`, `paper_authors`, `paper_year`, `paper_link`) VALUES
('1', 'Diverse Machine Learning-Based Malicious Detection for Industrial Control System', 'Chen, Y.C., Cheng, C.H., Lin, T.W., Lee, J.S*', '2025', 'Accepted by Electronics, 14, 2025-04. (SSCI, SCIE)'),
('2', 'Unconsciously Continuous Authentication Protocol in Zero-trust Architecture based on Behavioral Biometrics', NULL, '2025', 'Accepted by IEEE Transactions on Reliability, 000, 2025-02. (SCIE)'),
('3', 'ML-based Intrusion Detection System for Precise APT Cyber-clustering', NULL, '2024', 'Computers & Secuirty, vol. 149, 2024-11. (SCIE)');

-- --------------------------------------------------------

--
-- 資料表結構 `participation`
--

CREATE TABLE `participation` (
  `teacher_ID` char(15) NOT NULL,
  `project_ID` char(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `personal_info`
--

CREATE TABLE `personal_info` (
  `teacher_ID` char(15) NOT NULL,
  `teacher_name` varchar(25) DEFAULT NULL,
  `teacher_email` varchar(25) DEFAULT NULL,
  `teacher_intro` text DEFAULT NULL,
  `office_location` varchar(25) DEFAULT NULL,
  `office_hours` varchar(25) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `personal_info`
--

INSERT INTO `personal_info` (`teacher_ID`, `teacher_name`, `teacher_email`, `teacher_intro`, `office_location`, `office_hours`) VALUES
('T002', '李榮三', 'leejs@fcu.edu.tw', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- 資料表結構 `project_info`
--

CREATE TABLE `project_info` (
  `project_ID` char(15) NOT NULL,
  `project_role` varchar(50) DEFAULT NULL,
  `project_period` date DEFAULT NULL,
  `project_organization` varchar(100) DEFAULT NULL,
  `project_proof` varchar(300) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `publication`
--

CREATE TABLE `publication` (
  `teacher_ID` char(15) NOT NULL,
  `paper_ID` char(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `sensitive_words`
--

CREATE TABLE `sensitive_words` (
  `word_ID` int(11) NOT NULL,
  `word` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `sensitive_words`
--

INSERT INTO `sensitive_words` (`word_ID`, `word`) VALUES
(1, '靠北'),
(2, '智障'),
(3, '白痴'),
(4, '雞掰'),
(5, '幹'),
(6, '幹你娘'),
(7, '幹您娘'),
(8, '幹妳娘'),
(9, '操'),
(10, '傻逼'),
(11, '混帳'),
(12, '腦殘'),
(13, '白癡'),
(14, '機掰'),
(15, '媽的'),
(16, '馬的'),
(17, '嬤的');

-- --------------------------------------------------------

--
-- 資料表結構 `teacher_degree`
--

CREATE TABLE `teacher_degree` (
  `teacher_ID` char(15) NOT NULL,
  `degree` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `teacher_degree`
--

INSERT INTO `teacher_degree` (`teacher_ID`, `degree`) VALUES
('T002', '中正大學 資訊工程學系 博士'),
('T002', '中正大學 資訊工程學系 學士');

-- --------------------------------------------------------

--
-- 資料表結構 `teacher_major`
--

CREATE TABLE `teacher_major` (
  `teacher_ID` char(15) NOT NULL,
  `major` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `teacher_major`
--

INSERT INTO `teacher_major` (`teacher_ID`, `major`) VALUES
('T002', '區塊鏈技術與應用'),
('T002', '密碼學'),
('T002', '數位影像處理'),
('T002', '無線通訊'),
('T002', '資訊安全'),
('T002', '電子商務');

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `appointment_info`
--
ALTER TABLE `appointment_info`
  ADD PRIMARY KEY (`appointment_ID`),
  ADD KEY `course_ID` (`course_ID`);

--
-- 資料表索引 `appointment_mapping`
--
ALTER TABLE `appointment_mapping`
  ADD PRIMARY KEY (`teacher_ID`,`appointment_ID`),
  ADD KEY `appointment_ID` (`appointment_ID`);

--
-- 資料表索引 `campus_experience`
--
ALTER TABLE `campus_experience`
  ADD PRIMARY KEY (`teacher_ID`,`experience`);

--
-- 資料表索引 `course_info`
--
ALTER TABLE `course_info`
  ADD PRIMARY KEY (`course_ID`),
  ADD KEY `teacher_ID` (`teacher_ID`);

--
-- 資料表索引 `evaluation`
--
ALTER TABLE `evaluation`
  ADD PRIMARY KEY (`evaluate_ID`);

--
-- 資料表索引 `evaluation_mapping`
--
ALTER TABLE `evaluation_mapping`
  ADD PRIMARY KEY (`course_ID`,`evaluate_ID`),
  ADD KEY `evaluate_ID` (`evaluate_ID`);

--
-- 資料表索引 `external_experience`
--
ALTER TABLE `external_experience`
  ADD PRIMARY KEY (`teacher_ID`,`experience`);

--
-- 資料表索引 `login_info`
--
ALTER TABLE `login_info`
  ADD PRIMARY KEY (`professor_accoutnumber`);

--
-- 資料表索引 `message_board`
--
ALTER TABLE `message_board`
  ADD PRIMARY KEY (`question_ID`);

--
-- 資料表索引 `paper_info`
--
ALTER TABLE `paper_info`
  ADD PRIMARY KEY (`paper_ID`);

--
-- 資料表索引 `participation`
--
ALTER TABLE `participation`
  ADD PRIMARY KEY (`teacher_ID`,`project_ID`),
  ADD KEY `project_ID` (`project_ID`);

--
-- 資料表索引 `personal_info`
--
ALTER TABLE `personal_info`
  ADD PRIMARY KEY (`teacher_ID`);

--
-- 資料表索引 `project_info`
--
ALTER TABLE `project_info`
  ADD PRIMARY KEY (`project_ID`);

--
-- 資料表索引 `publication`
--
ALTER TABLE `publication`
  ADD PRIMARY KEY (`teacher_ID`,`paper_ID`),
  ADD KEY `paper_ID` (`paper_ID`);

--
-- 資料表索引 `sensitive_words`
--
ALTER TABLE `sensitive_words`
  ADD PRIMARY KEY (`word_ID`);

--
-- 資料表索引 `teacher_degree`
--
ALTER TABLE `teacher_degree`
  ADD PRIMARY KEY (`teacher_ID`,`degree`);

--
-- 資料表索引 `teacher_major`
--
ALTER TABLE `teacher_major`
  ADD PRIMARY KEY (`teacher_ID`,`major`);

--
-- 在傾印的資料表使用自動遞增(AUTO_INCREMENT)
--

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `sensitive_words`
--
ALTER TABLE `sensitive_words`
  MODIFY `word_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `appointment_info`
--
ALTER TABLE `appointment_info`
  ADD CONSTRAINT `appointment_info_ibfk_1` FOREIGN KEY (`course_ID`) REFERENCES `course_info` (`course_ID`);

--
-- 資料表的限制式 `appointment_mapping`
--
ALTER TABLE `appointment_mapping`
  ADD CONSTRAINT `appointment_mapping_ibfk_1` FOREIGN KEY (`teacher_ID`) REFERENCES `personal_info` (`teacher_ID`),
  ADD CONSTRAINT `appointment_mapping_ibfk_2` FOREIGN KEY (`appointment_ID`) REFERENCES `appointment_info` (`appointment_ID`);

--
-- 資料表的限制式 `campus_experience`
--
ALTER TABLE `campus_experience`
  ADD CONSTRAINT `campus_experience_ibfk_1` FOREIGN KEY (`teacher_ID`) REFERENCES `personal_info` (`teacher_ID`) ON DELETE CASCADE;

--
-- 資料表的限制式 `course_info`
--
ALTER TABLE `course_info`
  ADD CONSTRAINT `course_info_ibfk_1` FOREIGN KEY (`teacher_ID`) REFERENCES `personal_info` (`teacher_ID`);

--
-- 資料表的限制式 `evaluation_mapping`
--
ALTER TABLE `evaluation_mapping`
  ADD CONSTRAINT `evaluation_mapping_ibfk_1` FOREIGN KEY (`course_ID`) REFERENCES `course_info` (`course_ID`),
  ADD CONSTRAINT `evaluation_mapping_ibfk_2` FOREIGN KEY (`evaluate_ID`) REFERENCES `evaluation` (`evaluate_ID`);

--
-- 資料表的限制式 `external_experience`
--
ALTER TABLE `external_experience`
  ADD CONSTRAINT `external_experience_ibfk_1` FOREIGN KEY (`teacher_ID`) REFERENCES `personal_info` (`teacher_ID`) ON DELETE CASCADE;

--
-- 資料表的限制式 `participation`
--
ALTER TABLE `participation`
  ADD CONSTRAINT `participation_ibfk_1` FOREIGN KEY (`teacher_ID`) REFERENCES `personal_info` (`teacher_ID`),
  ADD CONSTRAINT `participation_ibfk_2` FOREIGN KEY (`project_ID`) REFERENCES `project_info` (`project_ID`);

--
-- 資料表的限制式 `publication`
--
ALTER TABLE `publication`
  ADD CONSTRAINT `publication_ibfk_1` FOREIGN KEY (`teacher_ID`) REFERENCES `personal_info` (`teacher_ID`),
  ADD CONSTRAINT `publication_ibfk_2` FOREIGN KEY (`paper_ID`) REFERENCES `paper_info` (`paper_ID`);

--
-- 資料表的限制式 `teacher_degree`
--
ALTER TABLE `teacher_degree`
  ADD CONSTRAINT `teacher_degree_ibfk_1` FOREIGN KEY (`teacher_ID`) REFERENCES `personal_info` (`teacher_ID`) ON DELETE CASCADE;

--
-- 資料表的限制式 `teacher_major`
--
ALTER TABLE `teacher_major`
  ADD CONSTRAINT `teacher_major_ibfk_1` FOREIGN KEY (`teacher_ID`) REFERENCES `personal_info` (`teacher_ID`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
