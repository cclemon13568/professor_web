-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- 主機： localhost:3306
-- 產生時間： 2025 年 05 月 25 日 08:29
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
-- 資料庫： `D1249166`
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

--
-- 傾印資料表的資料 `appointment_info`
--

INSERT INTO `appointment_info` (`appointment_ID`, `office_location`, `appoint_Date`, `status`, `student_ID`, `student_Name`, `course_ID`, `problem_description`) VALUES
('A001(test)', 'E405(test)', '2025-05-21 00:00:00', 0, 'S001(test)', '王小明(test)', 'CS001', '想詢問專題方向與資料蒐集方式(test)'),
('A002(test)', 'E406(test)', '2025-05-22 00:00:00', 1, 'S002(test)', '林小華(test)', 'CS002', '不確定作業需求內容與評分標準(test)'),
('A003(test)', 'E405(test)', '2025-05-23 00:00:00', 2, 'S003(test)', '張大同(test)', 'CS001', '想更改期末報告主題(test)');

-- --------------------------------------------------------

--
-- 資料表結構 `appointment_mapping`
--

CREATE TABLE `appointment_mapping` (
  `teacher_ID` char(15) NOT NULL,
  `appointment_ID` char(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `appointment_mapping`
--

INSERT INTO `appointment_mapping` (`teacher_ID`, `appointment_ID`) VALUES
('T002', 'A001(test)'),
('T002', 'A002(test)'),
('T002', 'A003(test)');

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

--
-- 傾印資料表的資料 `course_info`
--

INSERT INTO `course_info` (`course_ID`, `course_name`, `course_time`, `course_outline`, `teacher_ID`, `course_score`) VALUES
('CS001', '網路安全實務與社會', '星期六 09:10~12:00', '此課程致力於結合理論知識與實際應用，以解決民間社會所面臨的網路安全挑戰。本課程由加州大學柏克萊分校的網路安全診所聯盟 (Consortium of Cybersecurity Clinics) 所開發。學生將能夠學習網路安全原則、倫理考量及風險管理，同時積極參與專案，為脆弱的非營利組織及中小企業提供真實世界的網路安全解決方案。協同合作的環境鼓勵學生發揮所長並獲得新的技能，讓他們為面對多方面的網路安全挑戰做好準備。', 'T002', '3'),
('CS002', '專題研究（一）', '星期二、三 12:10~13:00', '訓練學生在資訊倫理規範下以團隊的方式，自行獨立完成自訂專題系統的實作或理論的推演。對於專業領域皆能有深度的認知與實作經驗。', 'T002', '2');

-- --------------------------------------------------------

--
-- 資料表結構 `evaluation`
--

CREATE TABLE `evaluation` (
  `evaluate_ID` char(15) NOT NULL,
  `student_ID` char(15) DEFAULT NULL,
  `course_period` varchar(20) DEFAULT NULL,
  `evaluate` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `evaluation`
--

INSERT INTO `evaluation` (`evaluate_ID`, `student_ID`, `course_period`, `evaluate`) VALUES
('E001(test)', 'S001(test)', '112-1(test)', '老師教學認真，內容深入淺出，收穫很多。(test)'),
('E002(test)', 'S002(test)', '112-1(test)', '課程安排合理，實作機會多，增進實務經驗。(test)'),
('E003(test)', 'S003(test)', '112-2(test)', '希望能增加討論時間，幫助理解複雜概念。(test)');

-- --------------------------------------------------------

--
-- 資料表結構 `evaluation_mapping`
--

CREATE TABLE `evaluation_mapping` (
  `course_ID` char(15) NOT NULL,
  `evaluate_ID` char(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `evaluation_mapping`
--

INSERT INTO `evaluation_mapping` (`course_ID`, `evaluate_ID`) VALUES
('CS001', 'E001(test)'),
('CS001', 'E002(test)'),
('CS002', 'E003(test)');

-- --------------------------------------------------------

--
-- 資料表結構 `external_experience`
--

CREATE TABLE `external_experience` (
  `teacher_ID` char(15) NOT NULL,
  `experience` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `external_experience`
--

INSERT INTO `external_experience` (`teacher_ID`, `experience`) VALUES
('T002', '參與政府資安政策白皮書撰寫計畫，提供AI資安應用建議。(test)'),
('T002', '受邀至國際資安研討會發表「人工智慧與資安未來」專題演講。(test)'),
('T002', '曾任某科技公司資安顧問，負責企業資安風險評估與防護規劃。(test)');

-- --------------------------------------------------------

--
-- 資料表結構 `login_info`
--

CREATE TABLE `login_info` (
  `professor_accoutnumber` char(15) NOT NULL,
  `professor_password` varchar(50) DEFAULT NULL,
  `verification_code` char(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `login_info`
--

INSERT INTO `login_info` (`professor_accoutnumber`, `professor_password`, `verification_code`) VALUES
('T002(test)', 'pass123(test)', 'VER123(test)');

-- --------------------------------------------------------

--
-- 資料表結構 `message_board`
--

CREATE TABLE `message_board` (
  `question_ID` varchar(10) NOT NULL,
  `question_name` varchar(100) DEFAULT NULL,
  `question_department` varchar(100) DEFAULT NULL,
  `question_title` text DEFAULT NULL,
  `question_content` text DEFAULT NULL,
  `popular_question` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `message_board`
--

INSERT INTO `message_board` (`question_ID`, `question_name`, `question_department`, `question_title`, `question_content`, `popular_question`) VALUES
('Q001(test)', '學生A(test)', '資訊工程系(test)', '專題報告格式是否有統一規定？(test)', '我即將開始撰寫專題研究報告，想知道是否有標準的格式可遵循，例如封面格式、字體大小、頁數限制等。(test)', '是(test)'),
('Q002(test)', '學生B(test)', '資管系(test)', '可以使用AI工具協助撰寫報告嗎？(test)', '我們課堂上要寫期末報告，如果使用像 ChatGPT 的工具產生內容，這樣算違規嗎？可以接受嗎？(test)', '否(test)'),
('Q003(test)', '學生C(test)', '電子系(test)', '選修課的加退選時間是什麼時候？(test)', '請問下學期選修課的加退選時間如何查詢？是否會公告在學校系統？(test)', '是(test)'),
('Q004(test)', '學生D(test)', '機械系(test)', '請假會不會影響期末成績？(test)', '因為有家庭因素，這學期可能需請幾次假，想知道是否會對出席率或成績造成影響。(test)', '否(test)'),
('Q005(test)', '學生E(test)', '外文系(test)', '期末報告能以影片形式繳交嗎？(test)', '我有拍攝一段影片作為報告內容，比傳統書面報告更具體、生動，不知道老師是否接受影片作為繳交形式？(test)', '否(test)');

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
  `project_ID` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `participation`
--

INSERT INTO `participation` (`teacher_ID`, `project_ID`) VALUES
('T002', 'NSTC111-1234-E-001-001'),
('T002', 'NSTC112-2221-E-035-050-MY3'),
('T002', 'NSTC112-2221-E-035-051-MY3');

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
('T002', '李榮三', 'leejs@fcu.edu.tw', '資安領域的先驅，專精人工智慧資安應用，引領未來科技發展。研究成果不僅在學術界備受矚目，更在產業界產生深遠影響。', '資訊安全實驗室', '星期一、四、五 12:10~1300(test)');

-- --------------------------------------------------------

--
-- 資料表結構 `project_info`
--

CREATE TABLE `project_info` (
  `project_ID` varchar(50) NOT NULL,
  `project_role` varchar(50) NOT NULL,
  `project_period` varchar(20) DEFAULT NULL,
  `project_organization` varchar(100) DEFAULT NULL,
  `project_proof` varchar(300) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `project_info`
--

INSERT INTO `project_info` (`project_ID`, `project_role`, `project_period`, `project_organization`, `project_proof`) VALUES
('NSTC110-9999-E-020-020', '主持人', '2022-05~2023-04', '產業合作計畫', '證明文件E.pdf'),
('NSTC111-1234-E-001-001', '主持人', '2023-01~2023-12', '教育部計畫', '證明文件C.pdf'),
('NSTC112-2221-E-035-050-MY3', '主持人', '2024-08~2025-07', '國科會計畫(25)', '證明文件A.pdf'),
('NSTC112-2221-E-035-051-MY3', '共同主持', '2023-10~2024-07', '國科會計畫(24)', '證明文件B.pdf'),
('NSTC113-5678-E-045-010', '協同主持', '2025-01~2026-12', '科技部專案', '證明文件D.pdf');

-- --------------------------------------------------------

--
-- 資料表結構 `publication`
--

CREATE TABLE `publication` (
  `teacher_ID` char(15) NOT NULL,
  `paper_ID` char(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `publication`
--

INSERT INTO `publication` (`teacher_ID`, `paper_ID`) VALUES
('T002', '1'),
('T002', '2'),
('T002', '3');

-- --------------------------------------------------------

--
-- 資料表結構 `responds`
--

CREATE TABLE `responds` (
  `respond_ID` int(11) NOT NULL,
  `question_ID` varchar(10) DEFAULT NULL,
  `respond_content` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `responds`
--

INSERT INTO `responds` (`respond_ID`, `question_ID`, `respond_content`, `created_at`) VALUES
(1, 'Q001(test)', '請參考教務處公告的專題報告格式說明文件。(test)', '2025-05-25 08:29:16'),
(2, 'Q001(test)', '也可參考前屆學長姐的報告作為參考範例。(test)', '2025-05-25 08:29:16'),
(3, 'Q002(test)', 'AI 工具僅限用於語言潤飾，內容應為原創。(test)', '2025-05-25 08:29:16'),
(4, 'Q002(test)', '部分老師可能接受，但需事先取得同意。(test)', '2025-05-25 08:29:16'),
(5, 'Q003(test)', '加退選時間通常於開學前後公告，請密切注意教務處網站或校務系統。(test)', '2025-05-25 08:29:16'),
(6, 'Q003(test)', '建議也可詢問導師或系辦確認正確時間。(test)', '2025-05-25 08:29:16'),
(7, 'Q004(test)', '出席狀況可能影響平時成績，請事先與授課老師溝通請假原因。(test)', '2025-05-25 08:29:16'),
(8, 'Q004(test)', '有些課程會計算出席率，應避免無故缺課。(test)', '2025-05-25 08:29:16'),
(9, 'Q005(test)', '依據課綱要求，如未註明可使用影片，則應繳交書面報告。(test)', '2025-05-25 08:29:16'),
(10, 'Q005(test)', '如需影片輔助，可事先詢問授課老師是否接受。(test)', '2025-05-25 08:29:16');

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
  ADD KEY `participation_ibfk_1` (`project_ID`);

--
-- 資料表索引 `personal_info`
--
ALTER TABLE `personal_info`
  ADD PRIMARY KEY (`teacher_ID`);

--
-- 資料表索引 `project_info`
--
ALTER TABLE `project_info`
  ADD UNIQUE KEY `project_ID` (`project_ID`);

--
-- 資料表索引 `publication`
--
ALTER TABLE `publication`
  ADD PRIMARY KEY (`teacher_ID`,`paper_ID`),
  ADD KEY `paper_ID` (`paper_ID`);

--
-- 資料表索引 `responds`
--
ALTER TABLE `responds`
  ADD PRIMARY KEY (`respond_ID`),
  ADD KEY `question_ID` (`question_ID`);

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
-- 使用資料表自動遞增(AUTO_INCREMENT) `responds`
--
ALTER TABLE `responds`
  MODIFY `respond_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

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
  ADD CONSTRAINT `participation_ibfk_1` FOREIGN KEY (`project_ID`) REFERENCES `project_info` (`project_ID`);

--
-- 資料表的限制式 `publication`
--
ALTER TABLE `publication`
  ADD CONSTRAINT `publication_ibfk_1` FOREIGN KEY (`teacher_ID`) REFERENCES `personal_info` (`teacher_ID`),
  ADD CONSTRAINT `publication_ibfk_2` FOREIGN KEY (`paper_ID`) REFERENCES `paper_info` (`paper_ID`);

--
-- 資料表的限制式 `responds`
--
ALTER TABLE `responds`
  ADD CONSTRAINT `responds_ibfk_1` FOREIGN KEY (`question_ID`) REFERENCES `message_board` (`question_ID`);

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
