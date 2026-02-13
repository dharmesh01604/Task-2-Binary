const baseUrl = `https://698d77b5b79d1c928ed567d4.mockapi.io/tasks`
let allTasks = [];
let numberOfRows = 5;
let currentPage = 1;
let toast;

function createLoaderElement() {
    if ($('#api-loader').length === 0) {
        $('body').append(`
            <div id="api-loader" class="api-loader">
                <div class="spinner" aria-hidden="true"></div>
            </div>
        `);
    }
}
function ShowLoader() {
    createLoaderElement();
    $('#api-loader').addClass('visible');
}
function HideLoader() {
    $('#api-loader').removeClass('visible');
}

function ShowToast(isSuccess, msg) {
    toast.empty();
    let success = `
        <div class="toast text-bg-success border-0 position-fixed top-0 end-0 m-3 show" role="alert">
        <div class="d-flex">
            <div class="toast-body">
            ${msg}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto"
            onclick="$(this).closest('.toast').remove()"></button>
        </div>
        </div>`;

    let failed = `
        <div class="toast text-bg-danger border-0 position-fixed top-0 end-0 m-3 show" role="alert">
        <div class="d-flex">
            <div class="toast-body">
            ${msg}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto"
            onclick="$(this).closest('.toast').remove()"></button>
        </div>
        </div>`;

    if (isSuccess) {
        toast.append(success);
    }
    else {
        toast.append(failed);
    }
    setTimeout(() => {
        toast.empty();
    }, 3000);
}

async function LoadTask() {
    try {
        ShowLoader();
        let r = await fetch("https://698d77b5b79d1c928ed567d4.mockapi.io/tasks");
        const data = await r.json();
        allTasks = data
        console.log(allTasks)
    }
    catch (err) {
        console.error(err);
    }
    finally {
        HideLoader();
    }
}

function CheckEmpty(inputId, errorId, message) {
    let inputElement = $(inputId).val().trim();
    if (!inputElement) {
        $(errorId).text(message)
        return true;
    }
    else {
        $(errorId).text("")
        return false;
    }
}

async function EditTask(id) {
    let task = allTasks.find(t => t.id == id);
    $("#taskName").val(task.taskName);
    $("#dueDate").val(task.dueDate);
    $("#category").val(task.category);
    $("#priority").val(task.priority);
    $("#notes").val(task.notes);
    $("#SaveTask").hide();
    $("#UpdateTask").show();
    $(".iTask-Form")[0].scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
    $("#UpdateTask").on("click", async function (e) {
        e.preventDefault();
        try {
            ShowLoader();
            let r = await fetch(`${baseUrl}/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    taskName: $("#taskName").val(),
                    dueDate: $("#dueDate").val(),
                    category: $("#category").val(),
                    priority: $("#priority").val(),
                    notes: $("#notes").val()
                })
            });

            if (r.ok) {
                $("#taskName").val("");
                $("#dueDate").val("");
                $("#category").val("");
                $("#priority").val("Normal");
                $("#notes").val("");
                $("#UpdateTask").hide();
                $("#SaveTask").show();
                ShowToast(true, "Task Updated Successfully");
                await LoadTask();
                DisplayTable(currentPage);
                $(".data-section-view")[0].scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
            else {
                ShowToast(false, "Failed to Update Task");
            }
        }
        catch (err) {
            console.error(err);
            ShowToast(false, "Failed to Update Task");
        }
        finally {
            HideLoader();
        }
    })
}
async function DeleteTask(id) {
    let confirmDelete = confirm("Are you sure you want to delete this task?");
    if (!confirmDelete) {
        return;
    }
    try {
        ShowLoader();
        let r = await fetch(`${baseUrl}/${id}`, {
            method: "DELETE"
        });

        if (r.ok) {
            ShowToast(true, "Task Deleted Successfully");
            $("#taskName").val("");
            $("#dueDate").val("");
            $("#category").val("");
            $("#priority").val("Normal");
            $("#notes").val("");
        }
        else {
            ShowToast(false, "Failed to Delete Task");
        }
    }
    catch (err) {
        console.error(err);
        ShowToast(false, "Failed to Delete Task");
    }
    finally {
        HideLoader();
    }
    await LoadTask();
    DisplayTable(currentPage);
}

async function InsertTask(data) {
    try {
        ShowLoader();
        const res = await fetch(baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        console.log(res);
        if (res.ok) {
            ShowToast(true, "Task Added Successfully");
        } else {
            ShowToast(false, "Failed to Add Task");
        }

    } catch (error) {
        console.error("Error:", error);
        ShowToast(false, "Failed to Add Task");
    }
    finally {
        HideLoader();
    }
}
function ValidateDate() {
    let dueDate = $("#dueDate").val();
    const todayDate = new Date().toISOString().slice(0, 10);

    if (!dueDate) {
        $("#dueDateError").text("Due Date is Required");
        return false;
    }
    if (dueDate < todayDate) {
        $("#dueDateError").text("Due Date Should Be Greater Than Present Date");

        return false;
    }

    $("#dueDateError").text("");
    return true;
}
function changePage(event, page) {
    event.preventDefault();
    let pageCount = Math.ceil(allTasks.length / numberOfRows);
    if (page < 1 || page > pageCount) {
        return;
    }
    currentPage = page;
    DisplayTable(currentPage);
    SetupPagination();
}
function DisplayTable(page) {

    if (allTasks.length == 0) {
        console.log("No Data Found");
        $("#dataContainer").hide();
        $(".no-data-found").text("No Data Found")
        return;
    }
    else {
        $("#dataContainer").show();
        $(".no-data-found").text("");
        console.log("Data Found");
        try {
            $("#table-body").empty();
            let start = (page - 1) * numberOfRows;
            let end = start + numberOfRows;
            let paginatedTasks = allTasks.slice(start, end);
            $.each(paginatedTasks, function (index, record) {
                let priorityClass = record.priority === "High" ? "chip-red"
                    : record.priority === "Medium" ? "chip-orange"
                        : "chip-green";
                let row = `
                <tr key=${record.id} >
                    <td>${record.taskName}</td>
                    <td>${record.dueDate}</td>
                    <td><span class="${priorityClass}">${record.priority}</span></td>
                    <td>${record.category}</td>
                    <td class="d-flex align-items-center gap-4">
                        <button class="edit-button" onclick="EditTask(${record.id})">
                        <svg class="edit-svgIcon" viewBox="0 0 512 512">
                            <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>
                        </svg>
                        </button>

                        <button class="delete-button" onclick="DeleteTask(${record.id})">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 69 14"
                                class="svgIcon bin-top"
                            >
                                <g clip-path="url(#clip0_35_24)">
                                <path
                                    fill="black"
                                    d="M20.8232 2.62734L19.9948 4.21304C19.8224 4.54309 19.4808 4.75 19.1085 4.75H4.92857C2.20246 4.75 0 6.87266 0 9.5C0 12.1273 2.20246 14.25 4.92857 14.25H64.0714C66.7975 14.25 69 12.1273 69 9.5C69 6.87266 66.7975 4.75 64.0714 4.75H49.8915C49.5192 4.75 49.1776 4.54309 49.0052 4.21305L48.1768 2.62734C47.3451 1.00938 45.6355 0 43.7719 0H25.2281C23.3645 0 21.6549 1.00938 20.8232 2.62734ZM64.0023 20.0648C64.0397 19.4882 63.5822 19 63.0044 19H5.99556C5.4178 19 4.96025 19.4882 4.99766 20.0648L8.19375 69.3203C8.44018 73.0758 11.6746 76 15.5712 76H53.4288C57.3254 76 60.5598 73.0758 60.8062 69.3203L64.0023 20.0648Z"
                                ></path>
                                </g>
                                <defs>
                                <clipPath id="clip0_35_24">
                                    <rect fill="white" height="14" width="69"></rect>
                                </clipPath>
                                </defs>
                            </svg>

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 69 57"
                                class="svgIcon bin-bottom"
                            >
                                <g clip-path="url(#clip0_35_22)">
                                <path
                                    fill="black"
                                    d="M20.8232 -16.3727L19.9948 -14.787C19.8224 -14.4569 19.4808 -14.25 19.1085 -14.25H4.92857C2.20246 -14.25 0 -12.1273 0 -9.5C0 -6.8727 2.20246 -4.75 4.92857 -4.75H64.0714C66.7975 -4.75 69 -6.8727 69 -9.5C69 -12.1273 66.7975 -14.25 64.0714 -14.25H49.8915C49.5192 -14.25 49.1776 -14.4569 49.0052 -14.787L48.1768 -16.3727C47.3451 -17.9906 45.6355 -19 43.7719 -19H25.2281C23.3645 -19 21.6549 -17.9906 20.8232 -16.3727ZM64.0023 1.0648C64.0397 0.4882 63.5822 0 63.0044 0H5.99556C5.4178 0 4.96025 0.4882 4.99766 1.0648L8.19375 50.3203C8.44018 54.0758 11.6746 57 15.5712 57H53.4288C57.3254 57 60.5598 54.0758 60.8062 50.3203L64.0023 1.0648Z"
                                ></path>
                                </g>
                                <defs>
                                <clipPath id="clip0_35_22">
                                    <rect fill="white" height="57" width="69"></rect>
                                </clipPath>
                                </defs>
                            </svg>
                            </button>
                    </td>
            </tr>`
                $("#table-body").append(row);
            })
            return true;
        }
        catch {
            return false;
        }
    }
}
function SetupPagination() {
    let pageCount = Math.ceil(allTasks.length / numberOfRows);
    let pagination = $(".pagination");
    pagination.empty();
    $("#total-page").html(`Showing <span class="fw-semibold">${currentPage}</span> of <span class="fw-semibold">${pageCount}</span> pages`);
    pagination.append(`
            <li class="page-item"><a class="page-link" href="#" onClick="changePage(event, ${currentPage - 1})">Previous</a></li>
        `)
    for (let i = 1; i <= pageCount; i++) {
        let li = `
                 <li class="page-item ${currentPage === i ? "active" : ""}">
                    <a class="page-link" href="#" onclick="changePage(event, ${i})">${i}</a>
                 </li>
        `;
        pagination.append(li);
    }
    pagination.append(` 
            <li class="page-item"><a class="page-link" href="#" onClick="changePage(event , ${currentPage + 1})">Next</a></li>
        `);

}
function ViewTask() {
    $(".data-section-view")[0].scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function FilterTasks(category) {
    // guard: normalize inputs and handle missing category on records
    let query = (category || "").toLowerCase();
    let filteredTasks = allTasks.filter(t => (t.category || "").toLowerCase().includes(query));
    let tBody = $("#table-body");
    tBody.empty();
    if (category == "") {
        DisplayTable(currentPage);
        return;
    }
    // if (filteredTasks.length == 0) {
    //     $("#dataContainer").hide();
    //     $(".no-data-found").text("No Data Found")
    //     return;
    // }
    filteredTasks.forEach(record => {
        // compute chip class same as DisplayTable
        let priorityClass = record.priority === "High" ? "chip-red"
            : record.priority === "Medium" ? "chip-orange"
                : "chip-green";
        let row = $(`
            <tr>
                <td>${record.taskName}</td>
                <td>${record.dueDate}</td>
                <td><span class="${priorityClass}">${record.priority}</span></td>
                <td>${record.category}</td>
               <td class="d-flex align-items-center gap-4">
                    <button class="edit-button" onclick="EditTask(${record.id})">
                    <svg class="edit-svgIcon" viewBox="0 0 512 512">
                        <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>
                    </svg>
                    </button>

                    <button class="delete-button" onclick="DeleteTask(${record.id})">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 69 14"
                            class="svgIcon bin-top"
                        >
                            <g clip-path="url(#clip0_35_24)">
                            <path
                                fill="black"
                                d="M20.8232 2.62734L19.9948 4.21304C19.8224 4.54309 19.4808 4.75 19.1085 4.75H4.92857C2.20246 4.75 0 6.87266 0 9.5C0 12.1273 2.20246 14.25 4.92857 14.25H64.0714C66.7975 14.25 69 12.1273 69 9.5C69 6.87266 66.7975 4.75 64.0714 4.75H49.8915C49.5192 4.75 49.1776 4.54309 49.0052 4.21305L48.1768 2.62734C47.3451 1.00938 45.6355 0 43.7719 0H25.2281C23.3645 0 21.6549 1.00938 20.8232 2.62734ZM64.0023 20.0648C64.0397 19.4882 63.5822 19 63.0044 19H5.99556C5.4178 19 4.96025 19.4882 4.99766 20.0648L8.19375 69.3203C8.44018 73.0758 11.6746 76 15.5712 76H53.4288C57.3254 76 60.5598 73.0758 60.8062 69.3203L64.0023 20.0648Z"
                            ></path>
                            </g>
                            <defs>
                            <clipPath id="clip0_35_24">
                                <rect fill="white" height="14" width="69"></rect>
                            </clipPath>
                            </defs>
                        </svg>

                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 69 57"
                            class="svgIcon bin-bottom"
                        >
                            <g clip-path="url(#clip0_35_22)">
                            <path
                                fill="black"
                                d="M20.8232 -16.3727L19.9948 -14.787C19.8224 -14.4569 19.4808 -14.25 19.1085 -14.25H4.92857C2.20246 -14.25 0 -12.1273 0 -9.5C0 -6.8727 2.20246 -4.75 4.92857 -4.75H64.0714C66.7975 -4.75 69 -6.8727 69 -9.5C69 -12.1273 66.7975 -14.25 64.0714 -14.25H49.8915C49.5192 -14.25 49.1776 -14.4569 49.0052 -14.787L48.1768 -16.3727C47.3451 -17.9906 45.6355 -19 43.7719 -19H25.2281C23.3645 -19 21.6549 -17.9906 20.8232 -16.3727ZM64.0023 1.0648C64.0397 0.4882 63.5822 0 63.0044 0H5.99556C5.4178 0 4.96025 0.4882 4.99766 1.0648L8.19375 50.3203C8.44018 54.0758 11.6746 57 15.5712 57H53.4288C57.3254 57 60.5598 54.0758 60.8062 50.3203L64.0023 1.0648Z"
                            ></path>
                            </g>
                            <defs>
                            <clipPath id="clip0_35_22">
                                <rect fill="white" height="57" width="69"></rect>
                            </clipPath>
                            </defs>
                        </svg>
                        </button>
                </td>
            </tr>`
        );
        tBody.append(row)
    });
}

function SortByDueDate(isAscending) {
    if (isAscending) {
        allTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        DisplayTable(currentPage);
    } else {
        allTasks.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
        DisplayTable(currentPage);
    }
}

async function insertAllTestData() {
    let testData = [
        { taskName: "Task 1", dueDate: "2026-02-15", category: "Work", priority: "High", notes: "Prepare report" },
        { taskName: "Task 2", dueDate: "2026-02-16", category: "Personal", priority: "Medium", notes: "Buy groceries" },
        { taskName: "Task 3", dueDate: "2026-02-17", category: "Work", priority: "Normal", notes: "Send emails" },
        { taskName: "Task 4", dueDate: "2026-02-18", category: "Health", priority: "High", notes: "Doctor appointment" },
        { taskName: "Task 5", dueDate: "2026-02-19", category: "Finance", priority: "Medium", notes: "Pay bills" },
        { taskName: "Task 6", dueDate: "2026-02-20", category: "Work", priority: "Normal", notes: "Team meeting" },
        { taskName: "Task 7", dueDate: "2026-02-21", category: "Personal", priority: "High", notes: "Family dinner" },
        { taskName: "Task 8", dueDate: "2026-02-22", category: "Health", priority: "Medium", notes: "Gym session" },
        { taskName: "Task 9", dueDate: "2026-02-23", category: "Work", priority: "High", notes: "Client call" },
        { taskName: "Task 10", dueDate: "2026-02-24", category: "Finance", priority: "Normal", notes: "Check investments" },
        { taskName: "Task 11", dueDate: "2026-02-25", category: "Personal", priority: "Medium", notes: "Clean house" },
        { taskName: "Task 12", dueDate: "2026-02-26", category: "Work", priority: "High", notes: "Submit project" },
        { taskName: "Task 13", dueDate: "2026-02-27", category: "Health", priority: "Normal", notes: "Yoga session" },
        { taskName: "Task 14", dueDate: "2026-02-28", category: "Finance", priority: "High", notes: "Tax filing" },
        { taskName: "Task 15", dueDate: "2026-03-01", category: "Work", priority: "Medium", notes: "Code review" },
        { taskName: "Task 16", dueDate: "2026-03-02", category: "Personal", priority: "Normal", notes: "Watch movie" },
        { taskName: "Task 17", dueDate: "2026-03-03", category: "Health", priority: "High", notes: "Morning run" },
        { taskName: "Task 18", dueDate: "2026-03-04", category: "Work", priority: "Medium", notes: "Design update" },
        { taskName: "Task 19", dueDate: "2026-03-05", category: "Finance", priority: "Normal", notes: "Bank visit" },
        { taskName: "Task 20", dueDate: "2026-03-06", category: "Personal", priority: "High", notes: "Friend meetup" },
        { taskName: "Task 21", dueDate: "2026-03-07", category: "Work", priority: "Medium", notes: "Sprint planning" },
        { taskName: "Task 22", dueDate: "2026-03-08", category: "Health", priority: "Normal", notes: "Meditation" },
        { taskName: "Task 23", dueDate: "2026-03-09", category: "Finance", priority: "High", notes: "Loan payment" },
        { taskName: "Task 24", dueDate: "2026-03-10", category: "Work", priority: "Normal", notes: "Documentation" },
        { taskName: "Task 25", dueDate: "2026-03-11", category: "Personal", priority: "Medium", notes: "Shopping" },
        { taskName: "Task 26", dueDate: "2026-03-12", category: "Health", priority: "High", notes: "Dentist visit" },
        { taskName: "Task 27", dueDate: "2026-03-13", category: "Work", priority: "Medium", notes: "Bug fixing" },
        { taskName: "Task 28", dueDate: "2026-03-14", category: "Finance", priority: "Normal", notes: "Expense tracking" },
        { taskName: "Task 29", dueDate: "2026-03-15", category: "Personal", priority: "High", notes: "Travel planning" },
        { taskName: "Task 30", dueDate: "2026-03-16", category: "Work", priority: "Medium", notes: "Deployment" }
    ];
    for (let task of testData) {
        await InsertTask(task);
    }
}
$(document).ready(async function () {
    await LoadTask();
    $("#filterCategory").on("change", function () {
        let selectedCategory = $(this).val();
        FilterTasks(selectedCategory);
    });
    $("#sortbuDueDate").on("change", function () {
        console.log($(this).val());
        SortByDueDate($(this).val() === "Acending");
    });
    numberOfRows = parseInt($("#showEntries").val());
    DisplayTable(currentPage);
    SetupPagination();
    $("#showEntries").on("change", function () {
        currentPage = 1;
        numberOfRows = parseInt($(this).val());
        DisplayTable(currentPage);
        SetupPagination();
    });
    $("#UpdateTask").hide();
    let dataObject = {};
    $("#taskName").on("input", function () {
        CheckEmpty("#taskName", "#taskNameError", "Task Name Required");
    })
    $("#dueDate").on("input", function () {
        CheckEmpty("#dueDate", "#dueDateError", "Due Date Required");

    })
    $("#dueDate").on("input", function () {
        ValidateDate();
    })
    $("#category").on("input", function () {
        CheckEmpty("#category", "#categoryError", "Category Required");
    })

    // insertAllTestData()

    $("#total-task").html(`Total Tasks: <span class="fw-semibold">${allTasks.length}</span>`);
    toast = $("#toasts");

    $("form").submit(async function (e) {
        e.preventDefault();
        let invalid = false;

        if (CheckEmpty("#taskName", "#taskNameError", "Task Name Required")) { invalid = true; }
        if (CheckEmpty("#dueDate", "#dueDateError", "Due Date Required")) { invalid = true; }
        if (CheckEmpty("#category", "#categoryError", "Category Required")) { invalid = true; }

        if (!ValidateDate()) { invalid = true; }


        if (invalid) {
            $(".iTask-Form")[0].scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
            return;
        }

        dataObject = {
            taskName: $("#taskName").val(),
            dueDate: $("#dueDate").val(),
            category: $("#category").val(),
            priority: $("#priority").val(),
            notes: $("#notes").val(),
        }
        console.log(dataObject);
        await InsertTask(dataObject);
        this.reset();
        await LoadTask();
        DisplayTable(currentPage);

    })
})

