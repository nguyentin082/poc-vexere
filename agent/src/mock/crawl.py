from selenium import webdriver
from selenium.webdriver.common.by import By
import time
import json
import re


def init_driver():
    """Initialize and return the Chrome WebDriver."""
    driver = webdriver.Chrome()
    driver.get("https://vexere.com/vn/trung-tam-ho-tro/pho-bien.vi")
    time.sleep(2)
    return driver


def get_categories(driver):
    """Retrieve all FAQ categories elements."""
    return driver.find_elements(
        By.XPATH, '//div[starts-with(@class, "CategoryItem__Container")]'
    )


def scroll_to_element(driver, element, offset=100):
    """Scroll the element into view with an optional vertical offset."""
    driver.execute_script(
        "arguments[0].scrollIntoView({behavior: 'instant', block: 'center'});",
        element,
    )
    time.sleep(0.5)
    driver.execute_script(f"window.scrollBy(0, -{offset});")
    time.sleep(0.5)


def extract_answer(driver):
    """Extract and clean the answer text from the answer element."""
    answer_element = driver.find_element(
        By.XPATH, '//div[contains(@class, "ElementParagraph")]'
    )
    text = re.sub(r"\s+", " ", answer_element.text).strip()
    return text


def process_category(driver, category, category_index):
    """Process a single FAQ category and return collected Q&A data."""
    faq_data = []
    try:
        category_title = category.find_element(
            By.XPATH, './/div[starts-with(@class, "base__Headline01")]'
        ).text.strip()
        faq_blocks = category.find_elements(
            By.XPATH, './/div[starts-with(@class, "CategoryQuestionItem__Container")]'
        )
        print(f"📂 Category {category_index+1}: Found {len(faq_blocks)} questions")

        for i in range(len(faq_blocks)):
            try:
                block = faq_blocks[i]
                scroll_to_element(driver, block)
                block.click()
                time.sleep(1.5)

                text = extract_answer(driver)
                faq_data.append({"category": category_title, "question_answer": text})
                print(f"📌 Collected Q&A #{len(faq_data)}")

                driver.back()
                time.sleep(1.5)

                # Re-fetch categories and scroll to current category after navigating back
                categories_after_back = get_categories(driver)
                if category_index >= len(categories_after_back):
                    print(f"⚠️ Skipping category {category_index+1} after back")
                    break
                current_category = categories_after_back[category_index]
                scroll_to_element(driver, current_category)

                faq_blocks = current_category.find_elements(
                    By.XPATH,
                    './/div[starts-with(@class, "CategoryQuestionItem__Container")]',
                )

            except Exception as e:
                print(f"⚠️ Error at question {i} in category {category_index + 1}: {e}")
                continue
    except Exception as e:
        print(f"⚠️ Failed to load category {category_index + 1}: {e}")
    return faq_data


def main():
    driver = init_driver()
    faq_data = []

    categories = get_categories(driver)
    total_categories = len(categories)
    print(f"Found {total_categories} FAQ categories")

    for cat_index in range(total_categories):
        categories = get_categories(driver)
        if cat_index >= len(categories):
            print(f"⚠️ Skipping category {cat_index+1} due to DOM reload")
            continue
        category = categories[cat_index]
        faq_data.extend(process_category(driver, category, cat_index))

    print(f"FAQ Data: \n{faq_data}")

    driver.quit()

    # Export to JSON
    with open("src/mock/faq.json", "w", encoding="utf-8") as f:
        json.dump(faq_data, f, ensure_ascii=False, indent=2)

    print(f"Exported {len(faq_data)} FAQs to src/mock/faq.json")


if __name__ == "__main__":
    main()
